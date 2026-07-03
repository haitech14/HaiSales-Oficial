#!/usr/bin/env python3
"""Genera SQL de importación desde clientes_2026-07-02.xlsx"""

from __future__ import annotations

import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "supabase" / "migrations" / "clientes_2026-07-02.xlsx"
OUT_SQL = ROOT / "supabase" / "migrations" / "20260702120100_import_clientes_legacy_data.sql"

DIST_KEYWORDS = (
    "COPY",
    "SISTEMAS",
    "SOLUCIONES",
    "SUMINISTROS",
    "TECNOLOGIAS",
    "IMPORT",
    "DISTRIBUID",
    "COMPU",
    "COPIER",
    "DIGITAL",
)

TIPO_MAP = {
    "publico": "Público",
    "tecnico": "Técnico",
    "distribuidor_no_tecnico": "Distribuidor",
}

PLACEHOLDER_EMAILS = {"no-send@rapifac.com", "no-send@rapifac.com.br"}

UBIGEO_FALLBACK: dict[str, str] = {
    "010100": "Amazonas, Chachapoyas, Chachapoyas",
    "020101": "Áncash, Huaraz, Huaraz",
    "020105": "Áncash, Huaraz, Independencia",
    "020801": "Áncash, Santa, Santa",
    "021101": "Áncash, Huarmey, Huarmey",
    "021801": "Áncash, Santa, Chimbote",
    "021809": "Áncash, Santa, Nuevo Chimbote",
    "040101": "Arequipa, Arequipa, Arequipa",
    "040104": "Arequipa, Arequipa, Cerro Colorado",
    "050101": "Ayacucho, Huamanga, Ayacucho",
    "060101": "Cajamarca, Cajamarca, Cajamarca",
    "060108": "Cajamarca, Cajamarca, Los Baños del Inca",
    "070101": "Callao, Callao, Callao",
    "070102": "Callao, Callao, Bellavista",
    "070103": "Callao, Callao, Carmen de la Legua Reynoso",
    "070106": "Callao, Callao, Ventanilla",
    "080101": "Cusco, Cusco, Cusco",
    "080108": "Cusco, Cusco, Wanchaq",
    "090101": "Huancavelica, Huancavelica, Huancavelica",
    "100101": "Huánuco, Huánuco, Huánuco",
    "100102": "Huánuco, Huánuco, Amarilis",
    "110101": "Ica, Ica, Ica",
    "110201": "Ica, Chincha, Chincha Alta",
    "120101": "Junín, Huancayo, Huancayo",
    "120302": "Junín, Chupaca, Chupaca",
    "130101": "La Libertad, Trujillo, Trujillo",
    "140101": "Lambayeque, Chiclayo, Chiclayo",
    "150101": "Lima, Lima, Lima",
    "150103": "Lima, Lima, Ate",
    "150105": "Lima, Lima, Breña",
    "150112": "Lima, Lima, Lurigancho",
    "150114": "Lima, Lima, La Molina",
    "150115": "Lima, Lima, Los Olivos",
    "150116": "Lima, Lima, San Juan de Lurigancho",
    "150117": "Lima, Lima, San Isidro",
    "150130": "Lima, Lima, Villa El Salvador",
    "150131": "Lima, Lima, Villa María del Triunfo",
    "150140": "Lima, Lima, Surquillo",
    "150142": "Lima, Lima, Santiago de Surco",
    "200101": "Piura, Piura, Piura",
    "250101": "Ucayali, Coronel Portillo, Pucallpa",
}


def sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def clean_text(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text == "-":
        return None
    return text


def clean_email(value) -> str | None:
    email = clean_text(value)
    if not email:
        return None
    if email.lower() in PLACEHOLDER_EMAILS:
        return None
    return email


def clean_ruc(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    digits = re.sub(r"\D", "", text)
    if not digits:
        return None
    if len(digits) <= 8:
        return digits.zfill(8)
    return digits.zfill(11) if len(digits) < 11 else digits


def resolve_ciudad(ciudad_raw, direccion: str | None) -> str | None:
    ciudad = clean_text(ciudad_raw)
    if ciudad and not ciudad.isdigit():
        return ciudad.title() if ciudad.isupper() else ciudad

    if direccion:
        parts = [part.strip() for part in str(direccion).split(" - ") if part.strip() and part.strip() != "-"]
        if len(parts) >= 3:
            dept, prov, dist = parts[-3], parts[-2], parts[-1]
            return f"{dept.title()}, {prov.title()}, {dist.title()}"
        if parts:
            last = parts[-1]
            return last.title() if last.isupper() else last

    if ciudad and ciudad in UBIGEO_FALLBACK:
        return UBIGEO_FALLBACK[ciudad]

    return ciudad


def resolve_tipo_cliente(nombre: str, excel_tipo: str | None) -> str:
    upper_name = nombre.upper()
    if any(keyword in upper_name for keyword in DIST_KEYWORDS):
        return "Distribuidor"
    if excel_tipo:
        return TIPO_MAP.get(excel_tipo.strip().lower(), excel_tipo.strip().title())
    return "Público"


def resolve_estado(excel_estado: str | None) -> str:
    estado = (excel_estado or "prospecto").strip().lower()
    if estado in {"activo", "prospecto", "inactivo", "con_deuda"}:
        return estado
    return "prospecto"


def resolve_segmento(tipo_cliente: str) -> str:
    if tipo_cliente == "Distribuidor":
        return "Corporativo"
    if tipo_cliente == "Técnico":
        return "PYME"
    return "Otros"


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    headers = rows[0]
    data_rows = [row for row in rows[1:] if row and row[0]]

    lines: list[str] = [
        "-- Datos generados por scripts/import-clientes-xlsx.py",
        "TRUNCATE TABLE public.clientes_legacy_import;",
        "",
    ]

    for row in data_rows:
        nombre = clean_text(row[0]) or ""
        ruc = clean_ruc(row[1])
        correo = clean_email(row[2])
        telefono = clean_text(row[3])
        direccion = clean_text(row[4])
        ciudad = resolve_ciudad(row[5], direccion)
        tipo_cliente = resolve_tipo_cliente(nombre, clean_text(row[6]))
        estado = resolve_estado(clean_text(row[7]))
        observaciones = clean_text(row[10]) if len(row) > 10 else None

        if not ruc:
            continue

        lines.append(
            "INSERT INTO public.clientes_legacy_import "
            "(razon_social, ruc, correo, telefono, direccion, ciudad, tipo_cliente, estado, observaciones, segmento) VALUES ("
            f"{sql_literal(nombre)}, {sql_literal(ruc)}, {sql_literal(correo)}, {sql_literal(telefono)}, "
            f"{sql_literal(direccion)}, {sql_literal(ciudad)}, {sql_literal(tipo_cliente)}, {sql_literal(estado)}, "
            f"{sql_literal(observaciones)}, {sql_literal(resolve_segmento(tipo_cliente))}"
            ");"
        )

    OUT_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Generated {len(data_rows)} rows -> {OUT_SQL}")


if __name__ == "__main__":
    main()
