#!/usr/bin/env python3
"""Build SQL batches to import Haitech clients/products into HaiSales."""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_import_sql"
USER_ID = "f0981f54-f2db-4bfd-8e55-985d5d340502"
USD_TO_PEN = 3.75
BATCH = 150


def sql_str(value: str | None) -> str:
    if value is None:
        return "NULL"
    text = str(value).replace("\x00", "").strip()
    if not text:
        return "NULL"
    return "'" + text.replace("'", "''") + "'"


def sql_num(value, default: float = 0.0) -> str:
    try:
        n = float(value)
        if math.isnan(n) or math.isinf(n):
            n = default
    except (TypeError, ValueError):
        n = default
    return f"{max(0.0, n):.2f}"


def sql_int(value, default: int = 0) -> str:
    try:
        n = int(float(value))
    except (TypeError, ValueError):
        n = default
    return str(max(0, n))


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
    raw = row.get("price")
    try:
        amount = float(raw or 0)
    except (TypeError, ValueError):
        amount = 0.0
    currency = (row.get("currency") or "USD").upper()
    if currency == "PEN":
        return max(0.0, amount)
    return round(max(0.0, amount) * USD_TO_PEN, 2)


def product_sku(row: dict) -> str | None:
    inv = row.get("inventory_snapshot") or {}
    code = (inv.get("code") or "").strip()
    if code:
        return code[:80]
    pid = str(row.get("id") or "").strip()
    return pid[:80] if pid else None


def write_batches(prefix: str, statements: list[str]) -> list[Path]:
    OUT.mkdir(exist_ok=True)
    paths: list[Path] = []
    for i in range(0, len(statements), BATCH):
        chunk = statements[i : i + BATCH]
        path = OUT / f"{prefix}_{i // BATCH:03d}.sql"
        path.write_text("\n".join(chunk) + "\n", encoding="utf-8")
        paths.append(path)
    return paths


def build_clients() -> list[Path]:
    rows = json.loads((ROOT / "_tmp_soporte_clients.json").read_text(encoding="utf-8"))
    seen_ruc: set[str] = set()
    stmts: list[str] = []
    for row in rows:
        nombre = (row.get("nombre") or "").strip() or "Sin nombre"
        ruc = (row.get("ruc_dni") or "").strip() or None
        if ruc:
            digits = re.sub(r"\D+", "", ruc)
            ruc = digits if digits else ruc
            if ruc in seen_ruc:
                ruc = None
            else:
                seen_ruc.add(ruc)
        email = (row.get("email") or row.get("email_secundario") or "").strip() or None
        telefono = (row.get("telefono") or "").strip() or None
        direccion = (row.get("direccion") or "").strip() or None
        ciudad = (row.get("ciudad") or "").strip() or None
        distrito = (row.get("distrito") or "").strip() or None
        contacto = (row.get("nombre_contacto") or "").strip() or None
        tipo = (row.get("tipo_cliente") or "").strip() or None
        notas = (row.get("notas") or "").strip() or None
        prod = row.get("produccion_mensual_estimada")
        prod_txt = str(prod).strip() if prod is not None and str(prod).strip() else None
        created = (row.get("created_at") or "")[:10] or None
        segmento = map_segmento(tipo, row.get("pipeline_stage"))
        estado = map_estado(row.get("pipeline_stage"))
        source_id = str(row.get("id"))
        stmts.append(
            "INSERT INTO public.clientes ("
            "user_id, razon_social, ruc, direccion, telefono, email, correo, ciudad, distrito, "
            "tipo_cliente, notas, observaciones, contacto_nombre, segmento, estado_comercial, "
            "produccion_mensual, fecha_alta, source_system, source_id, activo"
            ") VALUES ("
            f"'{USER_ID}'::uuid, {sql_str(nombre)}, {sql_str(ruc)}, {sql_str(direccion)}, "
            f"{sql_str(telefono)}, {sql_str(email)}, {sql_str(email)}, {sql_str(ciudad)}, "
            f"{sql_str(distrito)}, {sql_str(tipo)}, {sql_str(notas)}, {sql_str(notas)}, "
            f"{sql_str(contacto)}, {sql_str(segmento)}, {sql_str(estado)}, {sql_str(prod_txt)}, "
            f"{sql_str(created) if created else 'CURRENT_DATE'}, "
            f"'soporte.haitech', {sql_str(source_id)}, true"
            ") ON CONFLICT DO NOTHING;"
        )
    header = [
        f"DELETE FROM public.clientes WHERE user_id = '{USER_ID}'::uuid AND source_system = 'soporte.haitech';"
    ]
    (OUT / "00_clear_clients.sql").write_text("\n".join(header) + "\n", encoding="utf-8")
    return [OUT / "00_clear_clients.sql"] + write_batches("clients", stmts)


def build_products() -> list[Path]:
    rows = json.loads((ROOT / "_tmp_store_products.json").read_text(encoding="utf-8"))
    seen_sku: set[str] = set()
    stmts: list[str] = []
    for row in rows:
        nombre = (row.get("name") or "").strip() or "Producto"
        sku = product_sku(row)
        if sku:
            if sku in seen_sku:
                sku = f"{sku}-{str(row.get('id'))[:8]}"
            seen_sku.add(sku)
        desc = (row.get("description") or "").strip() or None
        if desc and len(desc) > 2000:
            desc = desc[:2000]
        marca = (row.get("brand") or (row.get("inventory_snapshot") or {}).get("brand") or "").strip() or None
        categoria = (row.get("category") or "").strip() or None
        if categoria and len(categoria) > 200:
            categoria = categoria[:200]
        inv = row.get("inventory_snapshot") or {}
        stock_raw = row.get("stock")
        if stock_raw is None:
            stock_raw = inv.get("stock")
        stmts.append(
            "INSERT INTO public.productos ("
            "user_id, sku, nombre, descripcion, precio, stock, unidad, marca, categoria, tipo, "
            "source_system, source_id, moneda, activo"
            ") VALUES ("
            f"'{USER_ID}'::uuid, {sql_str(sku)}, {sql_str(nombre)}, {sql_str(desc)}, "
            f"{sql_num(price_pen(row))}, {sql_int(stock_raw)}, 'und', {sql_str(marca)}, "
            f"{sql_str(categoria)}, 'producto', 'haitech.pe', {sql_str(str(row.get('id')))}, "
            "'PEN', true"
            ") ON CONFLICT DO NOTHING;"
        )
    header = [
        f"DELETE FROM public.productos WHERE user_id = '{USER_ID}'::uuid AND source_system IN ('haitech.pe','soporte.haitech');"
    ]
    (OUT / "00_clear_products.sql").write_text("\n".join(header) + "\n", encoding="utf-8")
    return [OUT / "00_clear_products.sql"] + write_batches("products", stmts)


def build_service_prices() -> list[Path]:
    path = ROOT / "_tmp_service_prices.json"
    if not path.exists():
        return []
    rows = json.loads(path.read_text(encoding="utf-8"))
    stmts: list[str] = []
    for row in rows:
        eq = (row.get("equipment_type") or "eq").strip()
        st = (row.get("service_type") or "svc").strip()
        ct = (row.get("client_type") or "").strip()
        nombre = f"Servicio {eq.upper()} / {st}" + (f" ({ct})" if ct else "")
        desc = (row.get("description") or "").strip() or None
        precio = row.get("price") or 0
        source_id = str(row.get("id"))
        sku = f"SVC-{eq}-{st}-{ct or 'all'}"[:80]
        stmts.append(
            "INSERT INTO public.productos ("
            "user_id, sku, nombre, descripcion, precio, stock, unidad, marca, categoria, tipo, "
            "source_system, source_id, moneda, activo"
            ") VALUES ("
            f"'{USER_ID}'::uuid, {sql_str(sku)}, {sql_str(nombre)}, {sql_str(desc)}, "
            f"{sql_num(precio)}, 0, 'serv', 'HAITECH', 'Servicios', 'servicio', "
            f"'soporte.haitech', {sql_str(source_id)}, 'PEN', true"
            ") ON CONFLICT DO NOTHING;"
        )
    return write_batches("services", stmts)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.sql"):
        old.unlink()
    paths = build_clients() + build_products() + build_service_prices()
    manifest = OUT / "manifest.txt"
    manifest.write_text("\n".join(str(p.name) for p in paths) + "\n", encoding="utf-8")
    print(f"Wrote {len(paths)} SQL files to {OUT}")
    for p in paths[:5]:
        print(" -", p.name, p.stat().st_size)
    print(" ...")


if __name__ == "__main__":
    main()
