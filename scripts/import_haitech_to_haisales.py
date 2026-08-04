#!/usr/bin/env python3
"""One-off import Haitech data into HaiSales via service_role. Do not commit secrets."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
USER_ID = "f0981f54-f2db-4bfd-8e55-985d5d340502"
USD_TO_PEN = 3.75
BASE = (os.environ.get("HAISALES_URL") or "https://yxklqaedegfqcbrwodqb.supabase.co").rstrip("/")
KEY = os.environ.get("HAISALES_SERVICE_ROLE_KEY") or ""
BATCH = 200


def die(msg: str) -> None:
    print(msg, file=sys.stderr)
    sys.exit(1)


def req(method: str, path: str, body=None, prefer: str | None = None):
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:800]
        raise RuntimeError(f"{method} {path} -> {exc.code}: {detail}") from exc


def map_segmento(tipo: str | None, pipeline: str | None) -> str:
    t = (tipo or "").strip().lower()
    p = (pipeline or "").strip().lower()
    if p in {"prospecto", "lead", "nuevo"} or t in {"prospecto", "lead"}:
        return "Prospecto"
    if t in {"corporativo", "empresa", "privado", "b2b"}:
        return "Corporativo"
    if t in {"pyme", "negocio", "sme"}:
        return "PYME"
    if t in {"minorista", "publico", "público", "retail"}:
        return "Minorista"
    return "Otros"


def map_estado(pipeline: str | None) -> str:
    p = (pipeline or "").strip().lower()
    if p in {"prospecto", "lead", "nuevo", "calificacion", "calificación"}:
        return "prospecto"
    if p in {"inactivo", "perdido", "churn", "cerrado"}:
        return "inactivo"
    if p in {"deuda", "con_deuda", "moroso"}:
        return "con_deuda"
    return "activo"


def price_pen(row: dict) -> float:
    inv = row.get("inventory_snapshot") or {}
    prices = row.get("prices") or inv.get("prices") or {}
    for key in ("PEN", "pen", "soles", "Soles"):
        if prices.get(key) is not None:
            try:
                return max(0.0, float(prices[key]))
            except (TypeError, ValueError):
                pass
    try:
        amount = float(row.get("price") or 0)
    except (TypeError, ValueError):
        amount = 0.0
    currency = (row.get("currency") or "USD").upper()
    if currency == "PEN":
        return max(0.0, amount)
    return round(max(0.0, amount) * USD_TO_PEN, 2)


def chunked(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def main() -> None:
    if not KEY:
        die("Missing HAISALES_SERVICE_ROLE_KEY")

    # Clear previous sync
    req(
        "DELETE",
        f"/rest/v1/clientes?user_id=eq.{USER_ID}&source_system=eq.soporte.haitech",
        prefer="return=minimal",
    )
    req(
        "DELETE",
        f"/rest/v1/productos?user_id=eq.{USER_ID}&source_system=in.(haitech.pe,soporte.haitech)",
        prefer="return=minimal",
    )
    print("Cleared previous sync rows")

    clients_src = json.loads((ROOT / "_tmp_soporte_clients.json").read_text(encoding="utf-8"))
    seen_ruc: set[str] = set()
    clients: list[dict] = []
    for row in clients_src:
        ruc = (row.get("ruc_dni") or "").strip() or None
        if ruc:
            digits = re.sub(r"\D+", "", ruc)
            ruc = digits if digits else ruc
            if ruc in seen_ruc:
                ruc = None
            else:
                seen_ruc.add(ruc)
        email = (row.get("email") or row.get("email_secundario") or "").strip() or None
        created = (row.get("created_at") or "")[:10] or None
        prod = row.get("produccion_mensual_estimada")
        clients.append(
            {
                "user_id": USER_ID,
                "razon_social": (row.get("nombre") or "").strip() or "Sin nombre",
                "ruc": ruc,
                "direccion": (row.get("direccion") or "").strip() or None,
                "telefono": (row.get("telefono") or "").strip() or None,
                "email": email,
                "correo": email,
                "ciudad": (row.get("ciudad") or "").strip() or None,
                "distrito": (row.get("distrito") or "").strip() or None,
                "tipo_cliente": (row.get("tipo_cliente") or "").strip() or None,
                "notas": (row.get("notas") or "").strip() or None,
                "observaciones": (row.get("notas") or "").strip() or None,
                "contacto_nombre": (row.get("nombre_contacto") or "").strip() or None,
                "segmento": map_segmento(row.get("tipo_cliente"), row.get("pipeline_stage")),
                "estado_comercial": map_estado(row.get("pipeline_stage")),
                "produccion_mensual": str(prod).strip() if prod not in (None, "") else None,
                "fecha_alta": created,
                "source_system": "soporte.haitech",
                "source_id": str(row["id"]),
                "activo": True,
            }
        )

    inserted_clients = 0
    for batch in chunked(clients, BATCH):
        req("POST", "/rest/v1/clientes", batch, prefer="return=minimal")
        inserted_clients += len(batch)
        print(f"clients {inserted_clients}/{len(clients)}")

    products_src = json.loads((ROOT / "_tmp_store_products.json").read_text(encoding="utf-8"))
    seen_sku: set[str] = set()
    products: list[dict] = []
    for row in products_src:
        inv = row.get("inventory_snapshot") or {}
        sku = (inv.get("code") or "").strip() or str(row.get("id") or "")[:80]
        if sku in seen_sku:
            sku = f"{sku}-{str(row.get('id'))[:8]}"
        seen_sku.add(sku)
        desc = (row.get("description") or "").strip() or None
        if desc and len(desc) > 1500:
            desc = desc[:1500]
        cat = (row.get("category") or "").strip() or None
        if cat and len(cat) > 200:
            cat = cat[:200]
        stock = row.get("stock")
        if stock is None:
            stock = inv.get("stock")
        try:
            stock_i = max(0, int(float(stock or 0)))
        except (TypeError, ValueError):
            stock_i = 0
        products.append(
            {
                "user_id": USER_ID,
                "sku": sku or None,
                "nombre": (row.get("name") or "").strip() or "Producto",
                "descripcion": desc,
                "precio": price_pen(row),
                "stock": stock_i,
                "unidad": "und",
                "marca": (row.get("brand") or inv.get("brand") or "").strip() or None,
                "categoria": cat,
                "tipo": "producto",
                "source_system": "haitech.pe",
                "source_id": str(row.get("id")),
                "moneda": "PEN",
                "activo": True,
            }
        )

    svc_path = ROOT / "_tmp_service_prices.json"
    if svc_path.exists():
        for row in json.loads(svc_path.read_text(encoding="utf-8")):
            eq = (row.get("equipment_type") or "eq").strip()
            st = (row.get("service_type") or "svc").strip()
            ct = (row.get("client_type") or "").strip()
            try:
                precio = float(row.get("price") or 0)
            except (TypeError, ValueError):
                precio = 0.0
            products.append(
                {
                    "user_id": USER_ID,
                    "sku": f"SVC-{eq}-{st}-{ct or 'all'}"[:80],
                    "nombre": f"Servicio {eq.upper()} / {st}" + (f" ({ct})" if ct else ""),
                    "descripcion": (row.get("description") or "").strip() or None,
                    "precio": max(0.0, precio),
                    "stock": 0,
                    "unidad": "serv",
                    "marca": "HAITECH",
                    "categoria": "Servicios",
                    "tipo": "servicio",
                    "source_system": "soporte.haitech",
                    "source_id": str(row["id"]),
                    "moneda": "PEN",
                    "activo": True,
                }
            )

    inserted_products = 0
    for batch in chunked(products, BATCH):
        req("POST", "/rest/v1/productos", batch, prefer="return=minimal")
        inserted_products += len(batch)
        print(f"productos {inserted_products}/{len(products)}")

    print(f"DONE clients={inserted_clients} productos={inserted_products}")


if __name__ == "__main__":
    main()
