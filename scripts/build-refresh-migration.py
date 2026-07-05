#!/usr/bin/env python3
"""Combina los SQL de staging legacy en una migración de refresco."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
OUT = MIGRATIONS / "20260705130000_refresh_legacy_staging_data.sql"

SOURCES = [
    MIGRATIONS / "20260702120100_import_clientes_legacy_data.sql",
    MIGRATIONS / "20260702150100_import_productos_legacy_data.sql",
    MIGRATIONS / "20260702130100_import_ventas_legacy_data.sql",
    MIGRATIONS / "20260702160100_import_guias_legacy_data.sql",
    MIGRATIONS / "20260702170100_import_venta_items_legacy_data.sql",
]


def main() -> None:
    parts = [
        "-- Refresco de tablas staging legacy desde Excel (auto-generado)",
        "",
    ]

    for source in SOURCES:
        if not source.exists():
            raise FileNotFoundError(source)
        text = source.read_text(encoding="utf-8")
        parts.append(f"-- === {source.name} ===")
        parts.append(text.rstrip())
        parts.append("")

    OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
