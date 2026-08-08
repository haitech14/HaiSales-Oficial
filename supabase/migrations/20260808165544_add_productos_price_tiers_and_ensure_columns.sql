-- Price tiers by client type on productos

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_mayorista NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS precio_tecnico NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS precio_distribuidor NUMERIC(14, 2);

COMMENT ON COLUMN public.productos.precio IS 'Precio público / lista base';
COMMENT ON COLUMN public.productos.precio_mayorista IS 'Precio para tipo de cliente Mayorista';
COMMENT ON COLUMN public.productos.precio_tecnico IS 'Precio para tipo de cliente Técnico';
COMMENT ON COLUMN public.productos.precio_distribuidor IS 'Precio para tipo de cliente Distribuidor';

NOTIFY pgrst, 'reload schema';
