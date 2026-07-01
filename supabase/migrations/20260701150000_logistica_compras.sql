-- Logística / Compras: órdenes de compra e ítems

CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  requisicion_id TEXT,
  proveedor TEXT NOT NULL,
  proveedor_ruc TEXT,
  tipo TEXT NOT NULL DEFAULT 'compra'
    CHECK (tipo IN ('compra', 'servicio')),
  almacen TEXT NOT NULL DEFAULT 'Almacén Principal',
  importe DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (importe >= 0),
  estado TEXT NOT NULL DEFAULT 'emitida'
    CHECK (estado IN ('aprobada', 'emitida', 'en_transito', 'recibida', 'observada')),
  categoria TEXT NOT NULL DEFAULT 'orden'
    CHECK (categoria IN ('requisicion', 'orden', 'transito', 'recibida', 'observada')),
  responsable TEXT NOT NULL,
  responsable_iniciales TEXT,
  notas TEXT,
  fecha_entrega_estimada DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero)
);

CREATE INDEX IF NOT EXISTS ordenes_compra_user_created_idx
  ON public.ordenes_compra (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ordenes_compra_user_estado_idx
  ON public.ordenes_compra (user_id, estado);

ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own ordenes_compra" ON public.ordenes_compra;
DROP POLICY IF EXISTS "Users can insert own ordenes_compra" ON public.ordenes_compra;
DROP POLICY IF EXISTS "Users can update own ordenes_compra" ON public.ordenes_compra;
DROP POLICY IF EXISTS "Users can delete own ordenes_compra" ON public.ordenes_compra;

CREATE POLICY "Users can select own ordenes_compra" ON public.ordenes_compra
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ordenes_compra" ON public.ordenes_compra
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ordenes_compra" ON public.ordenes_compra
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ordenes_compra" ON public.ordenes_compra
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ordenes_compra_updated_at ON public.ordenes_compra;
CREATE TRIGGER update_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.orden_compra_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12, 3) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orden_compra_items_orden_idx
  ON public.orden_compra_items (orden_id);

ALTER TABLE public.orden_compra_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own orden_compra_items" ON public.orden_compra_items;
DROP POLICY IF EXISTS "Users can insert own orden_compra_items" ON public.orden_compra_items;
DROP POLICY IF EXISTS "Users can update own orden_compra_items" ON public.orden_compra_items;
DROP POLICY IF EXISTS "Users can delete own orden_compra_items" ON public.orden_compra_items;

CREATE POLICY "Users can select own orden_compra_items" ON public.orden_compra_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra o
      WHERE o.id = orden_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own orden_compra_items" ON public.orden_compra_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra o
      WHERE o.id = orden_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own orden_compra_items" ON public.orden_compra_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra o
      WHERE o.id = orden_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own orden_compra_items" ON public.orden_compra_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra o
      WHERE o.id = orden_id AND o.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_orden_compra_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.subtotal := ROUND(NEW.cantidad * NEW.precio_unitario, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_orden_compra_item_subtotal_on_write ON public.orden_compra_items;
CREATE TRIGGER set_orden_compra_item_subtotal_on_write
  BEFORE INSERT OR UPDATE ON public.orden_compra_items
  FOR EACH ROW EXECUTE FUNCTION public.set_orden_compra_item_subtotal();

CREATE OR REPLACE FUNCTION public.recalcular_orden_compra_importe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_orden_id UUID;
  nuevo_importe DECIMAL(12, 2);
BEGIN
  target_orden_id := COALESCE(NEW.orden_id, OLD.orden_id);

  SELECT COALESCE(SUM(subtotal), 0)
  INTO nuevo_importe
  FROM public.orden_compra_items
  WHERE orden_id = target_orden_id;

  UPDATE public.ordenes_compra
  SET importe = nuevo_importe, updated_at = now()
  WHERE id = target_orden_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_orden_compra_importe_on_items ON public.orden_compra_items;
CREATE TRIGGER recalcular_orden_compra_importe_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.orden_compra_items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_orden_compra_importe();
