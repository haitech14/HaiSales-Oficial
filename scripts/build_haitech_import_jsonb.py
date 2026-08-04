#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_import_sql"
USER_ID = "f0981f54-f2db-4bfd-8e55-985d5d340502"
USD_TO_PEN = 3.75
BATCH = 400


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


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.sql"):
        old.unlink()

    clients = json.loads((ROOT / "_tmp_soporte_clients.json").read_text(encoding="utf-8"))
    seen_ruc: set[str] = set()
    payload: list[dict] = []
    for row in clients:
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
        created = (row.get("created_at") or "")[:10] or None
        prod = row.get("produccion_mensual_estimada")
        payload.append(
            {
                "razon_social": nombre,
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
                "source_id": str(row["id"]),
            }
        )

    clients_sql = f"""DELETE FROM public.clientes WHERE user_id = '{USER_ID}'::uuid AND source_system = 'soporte.haitech';
INSERT INTO public.clientes (
  user_id, razon_social, ruc, direccion, telefono, email, correo, ciudad, distrito,
  tipo_cliente, notas, observaciones, contacto_nombre, segmento, estado_comercial,
  produccion_mensual, fecha_alta, source_system, source_id, activo
)
SELECT
  '{USER_ID}'::uuid,
  x.razon_social, x.ruc, x.direccion, x.telefono, x.email, x.correo, x.ciudad, x.distrito,
  x.tipo_cliente, x.notas, x.observaciones, x.contacto_nombre, x.segmento, x.estado_comercial,
  x.produccion_mensual, COALESCE(x.fecha_alta::date, CURRENT_DATE), 'soporte.haitech', x.source_id, true
FROM jsonb_to_recordset($j${json.dumps(payload, ensure_ascii=False)}$j$::jsonb) AS x(
  razon_social text, ruc text, direccion text, telefono text, email text, correo text,
  ciudad text, distrito text, tipo_cliente text, notas text, observaciones text,
  contacto_nombre text, segmento text, estado_comercial text, produccion_mensual text,
  fecha_alta text, source_id text
);
"""
    (OUT / "01_clients.sql").write_text(clients_sql, encoding="utf-8")
    print("clients", len(payload), (OUT / "01_clients.sql").stat().st_size)

    products = json.loads((ROOT / "_tmp_store_products.json").read_text(encoding="utf-8"))
    seen_sku: set[str] = set()
    prod_payload: list[dict] = []
    for row in products:
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
        prod_payload.append(
            {
                "sku": sku or None,
                "nombre": (row.get("name") or "").strip() or "Producto",
                "descripcion": desc,
                "precio": price_pen(row),
                "stock": stock_i,
                "marca": (row.get("brand") or inv.get("brand") or "").strip() or None,
                "categoria": cat,
                "source_id": str(row.get("id")),
            }
        )

    (OUT / "00_clear_products.sql").write_text(
        f"DELETE FROM public.productos WHERE user_id = '{USER_ID}'::uuid "
        "AND source_system IN ('haitech.pe','soporte.haitech');\n",
        encoding="utf-8",
    )

    for i in range(0, len(prod_payload), BATCH):
        chunk = prod_payload[i : i + BATCH]
        sql = f"""INSERT INTO public.productos (
  user_id, sku, nombre, descripcion, precio, stock, unidad, marca, categoria, tipo,
  source_system, source_id, moneda, activo
)
SELECT
  '{USER_ID}'::uuid, NULLIF(btrim(x.sku),''), x.nombre, x.descripcion, x.precio, x.stock, 'und',
  x.marca, x.categoria, 'producto', 'haitech.pe', x.source_id, 'PEN', true
FROM jsonb_to_recordset($j${json.dumps(chunk, ensure_ascii=False)}$j$::jsonb) AS x(
  sku text, nombre text, descripcion text, precio numeric, stock int, marca text, categoria text, source_id text
);
"""
        name = f"02_products_{i // BATCH:02d}.sql"
        (OUT / name).write_text(sql, encoding="utf-8")
        print(name, len(chunk), (OUT / name).stat().st_size)

    svc_path = ROOT / "_tmp_service_prices.json"
    if svc_path.exists():
        services = json.loads(svc_path.read_text(encoding="utf-8"))
        svc_payload = []
        for row in services:
            eq = (row.get("equipment_type") or "eq").strip()
            st = (row.get("service_type") or "svc").strip()
            ct = (row.get("client_type") or "").strip()
            try:
                precio = float(row.get("price") or 0)
            except (TypeError, ValueError):
                precio = 0.0
            svc_payload.append(
                {
                    "sku": f"SVC-{eq}-{st}-{ct or 'all'}"[:80],
                    "nombre": f"Servicio {eq.upper()} / {st}" + (f" ({ct})" if ct else ""),
                    "descripcion": (row.get("description") or "").strip() or None,
                    "precio": max(0.0, precio),
                    "stock": 0,
                    "marca": "HAITECH",
                    "categoria": "Servicios",
                    "tipo": "servicio",
                    "source_system": "soporte.haitech",
                    "source_id": str(row["id"]),
                }
            )
        sql = f"""INSERT INTO public.productos (
  user_id, sku, nombre, descripcion, precio, stock, unidad, marca, categoria, tipo,
  source_system, source_id, moneda, activo
)
SELECT
  '{USER_ID}'::uuid, NULLIF(btrim(x.sku),''), x.nombre, x.descripcion, x.precio, x.stock, 'serv',
  x.marca, x.categoria, x.tipo, x.source_system, x.source_id, 'PEN', true
FROM jsonb_to_recordset($j${json.dumps(svc_payload, ensure_ascii=False)}$j$::jsonb) AS x(
  sku text, nombre text, descripcion text, precio numeric, stock int, marca text, categoria text,
  tipo text, source_system text, source_id text
);
"""
        (OUT / "03_services.sql").write_text(sql, encoding="utf-8")
        print("services", len(svc_payload), (OUT / "03_services.sql").stat().st_size)

    names = sorted(p.name for p in OUT.glob("*.sql"))
    (OUT / "manifest.txt").write_text("\n".join(names) + "\n", encoding="utf-8")
    print("manifest", len(names))


if __name__ == "__main__":
    main()
