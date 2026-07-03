ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_compra TEXT DEFAULT 'OC001';
