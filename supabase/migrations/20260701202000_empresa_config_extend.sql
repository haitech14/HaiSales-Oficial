-- Campos extendidos: prefijo telefónico, monedas múltiples, series y sedes

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS telefono_prefijo TEXT NOT NULL DEFAULT '+51';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS monedas JSONB NOT NULL DEFAULT '["PEN"]'::jsonb;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_guia_remision TEXT DEFAULT 'T001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_proforma TEXT DEFAULT 'PR001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS sedes JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.empresa_config
SET monedas = jsonb_build_array(moneda)
WHERE monedas IS NULL OR monedas = '[]'::jsonb;
