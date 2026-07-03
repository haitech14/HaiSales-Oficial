ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_pedido TEXT DEFAULT 'OP001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_servicio TEXT DEFAULT 'OS001';
