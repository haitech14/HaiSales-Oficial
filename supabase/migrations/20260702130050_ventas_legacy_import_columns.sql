-- Columnas adicionales para import legacy (debe ejecutarse antes del seed 130100)

ALTER TABLE public.ventas_legacy_import
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS usuario_emision TEXT,
  ADD COLUMN IF NOT EXISTS numero_operacion TEXT;
