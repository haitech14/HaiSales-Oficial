#!/usr/bin/env python3
"""Limpia clientes.ciudad (solo ciudades válidas) y rellena clientes.pais."""

from __future__ import annotations

import json
import os
import re
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_URL = "https://yxklqaedegfqcbrwodqb.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")


def api_request(method: str, path: str, payload: dict | list | None = None) -> object:
    headers = {
        "apikey": SERVICE_KEY or "",
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if payload is None:
        headers.pop("Content-Type", None)
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{PROJECT_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else None


def fetch_rows() -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        batch = api_request(
            "GET",
            f"/rest/v1/clientes?select=id,ciudad,pais&order=id.asc&limit=500&offset={offset}",
        )
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < 500:
            break
        offset += 500
    return rows


def patch_row(row_id: str, ciudad: str | None, pais: str | None) -> None:
    api_request(
        "PATCH",
        f"/rest/v1/clientes?id=eq.{row_id}",
        {"ciudad": ciudad, "pais": pais},
    )

UBIGEO_FALLBACK = {
    "150116": "Lima, Lima, San Juan de Lurigancho",
}

PERU_DEPARTMENTS = {
    "amazonas", "ancash", "apurimac", "arequipa", "ayacucho", "cajamarca", "callao", "cusco",
    "huancavelica", "huanuco", "ica", "junin", "la libertad", "lambayeque", "lima", "loreto",
    "madre de dios", "moquegua", "pasco", "piura", "puno", "san martin", "tacna", "tumbes", "ucayali",
}

ADDRESS_RE = re.compile(
    r"\b(av\.?|avenida|calle|jr\.?|jiron|mz\.?|manzana|lt\.?|lote|aa\.?\s*hh|esquina|urbanizacion|urb\.?|"
    r"pasaje|car\.?|carretera|prolongacion|asociacion|cooperativa|ampliacion|bodega|almacen|frente|altura|"
    r"entre|cdra\.?|cuadra|mze\.?|parcela|comite|comit[eé]|pasando|estacion|paradero)\b",
    re.I,
)

INVALID = {"sin direccion", "sin dirección", "-", "—", "sdfasdsadsa", "asdassad"}

KNOWN_CITIES = [
    "Huancayo", "Trujillo", "Huaraz", "Chosica", "Pichanaqui", "Arequipa", "Chincha", "Iquitos",
    "Pucallpa", "Tarapoto", "Chiclayo", "Piura", "Cusco", "Tacna", "Ica", "Juliaca", "Moyobamba",
    "Rioja", "Satipo", "Barranca", "Cañete", "Ayacucho", "Cajamarca", "Moquegua", "Huancavelica",
    "Chulucanas", "Tingo Maria", "Chaclacayo", "Surco", "Callao", "Lima", "Zapallal", "Puente Piedra",
]


def norm_key(value: str) -> str:
    text = unicodedata.normalize("NFD", value)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower().strip()


def title_case(value: str) -> str:
    return " ".join(part.capitalize() for part in value.split())


def is_address_like(value: str) -> bool:
    if ADDRESS_RE.search(value):
        return True
    if re.match(r"^\d", value) and re.search(r"[A-Za-z]", value):
        return True
    if "((" in value or "))" in value:
        return True
    return False


def extract_city(value: str) -> str | None:
    trimmed = value.strip()
    if trimmed.startswith("-"):
        candidate = trimmed[1:].strip().split()[0]
        candidate = re.sub(r"[^A-Za-zÁÉÍÓÚáéíóúñÑ-]", "", candidate)
        if candidate and len(candidate) >= 3 and not ADDRESS_RE.search(candidate):
            return title_case(candidate)

    for city in KNOWN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", trimmed, re.I):
            return "Santiago de Surco" if city.lower() == "surco" else title_case(city)

    tokens = re.split(r"[\s,()/-]+", trimmed)
    for token in reversed(tokens):
        token = re.sub(r"[^A-Za-zÁÉÍÓÚáéíóúñÑ]", "", token)
        if len(token) < 3 or re.search(r"\d", token):
            continue
        if ADDRESS_RE.search(token):
            continue
        key = norm_key(token)
        if key in {"av", "jr", "mz", "lt", "pe", "peru", "lima"}:
            continue
        return title_case(token)
    return None


def normalize(raw: str | None) -> tuple[str | None, str | None]:
    if not raw or not raw.strip() or raw.strip() == "—":
        return None, None

    trimmed = raw.strip()
    bolivia = re.match(r"^(.+?)\s*[-–]\s*Bolivia\s*$", trimmed, re.I)
    if bolivia:
        return title_case(bolivia.group(1).strip()), "Bolivia"

    if re.fullmatch(r"\d{5,6}", trimmed):
        mapped = UBIGEO_FALLBACK.get(trimmed)
        if mapped:
            parts = [p.strip() for p in mapped.split(",")]
            return parts[-1] if parts else None, "Perú"
        return None, None

    if norm_key(trimmed) in INVALID:
        return None, None

    parts = [p.strip() for p in trimmed.split(",") if p.strip()]
    if len(parts) >= 3 and not is_address_like(trimmed):
        return trimmed, "Perú"
    if len(parts) == 2 and not is_address_like(trimmed):
        return trimmed, "Perú"

    if is_address_like(trimmed):
        extracted = extract_city(trimmed)
        return (extracted, "Perú") if extracted else (None, None)

    single_key = norm_key(parts[0])
    if single_key in PERU_DEPARTMENTS:
        return None, None
    if single_key in {"bogota", "cucuta"}:
        return title_case(parts[0]), "Colombia"
    if single_key == "sucre":
        return "Sucre", "Bolivia"
    if single_key == "manta":
        return "Manta", "Ecuador"

    if trimmed.lower().startswith("lima (") and "almac" in trimmed.lower():
        return "Lima", "Perú"

    return parts[0], "Perú"


def main() -> None:
    if not SERVICE_KEY:
        raise SystemExit("Define SUPABASE_SERVICE_ROLE_KEY")

    rows = fetch_rows()
    updates: list[dict] = []
    stats = {"cleaned": 0, "nulled": 0, "bolivia": 0, "unchanged": 0}

    for row in rows:
        raw = row.get("ciudad")
        new_ciudad, new_pais = normalize(raw)
        current_pais = row.get("pais")

        if (raw or None) == (new_ciudad or None) and (current_pais or None) == (new_pais or None):
            stats["unchanged"] += 1
            continue

        if new_pais == "Bolivia":
            stats["bolivia"] += 1
        elif new_ciudad is None:
            stats["nulled"] += 1
        else:
            stats["cleaned"] += 1

        updates.append({"id": row["id"], "ciudad": new_ciudad, "pais": new_pais})

    print(json.dumps({"total": len(rows), "updates": len(updates), **stats}, indent=2))

    for index in range(0, len(updates), 50):
        for item in updates[index : index + 50]:
            patch_row(item["id"], item["ciudad"], item["pais"])
        print(f"Patched {min(index + 50, len(updates))}/{len(updates)}")

    api_request(
        "PATCH",
        "/rest/v1/clientes?pais=is.null&ciudad=not.is.null",
        {"pais": "Perú"},
    )
    print("Default pais=Perú applied to remaining rows with ciudad")


if __name__ == "__main__":
    main()
