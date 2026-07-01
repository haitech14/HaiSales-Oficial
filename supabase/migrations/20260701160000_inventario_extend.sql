-- Inventario: extensión de productos para categoría, almacén, costo y tipo

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'General';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS almacen TEXT NOT NULL DEFAULT 'Almacén Central';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS costo DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (costo >= 0);
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'product'
  CHECK (tipo IN ('product', 'service', 'kit'));
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 10 CHECK (stock_minimo >= 0);
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS ultimo_movimiento_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS productos_user_categoria_idx
  ON public.productos (user_id, categoria);

CREATE INDEX IF NOT EXISTS productos_user_almacen_idx
  ON public.productos (user_id, almacen);

CREATE INDEX IF NOT EXISTS productos_user_tipo_idx
  ON public.productos (user_id, tipo);
