-- Cotizaciones comerciales

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  oportunidad_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  codigo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'vencida')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  igv DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (igv >= 0),
  total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  moneda TEXT NOT NULL DEFAULT 'PEN',
  validez_dias INTEGER NOT NULL DEFAULT 15 CHECK (validez_dias > 0),
  vendedor_nombre TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo)
);

CREATE INDEX IF NOT EXISTS cotizaciones_user_estado_idx
  ON public.cotizaciones (user_id, estado);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can insert own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can delete own cotizaciones" ON public.cotizaciones;

CREATE POLICY "Users can select own cotizaciones" ON public.cotizaciones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cotizaciones" ON public.cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cotizaciones" ON public.cotizaciones
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cotizaciones" ON public.cotizaciones
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_cotizaciones_updated_at ON public.cotizaciones;
CREATE TRIGGER update_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.cotizacion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12, 3) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cotizacion_items_cotizacion_idx
  ON public.cotizacion_items (cotizacion_id);

ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Users can insert own cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Users can update own cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Users can delete own cotizacion_items" ON public.cotizacion_items;

CREATE POLICY "Users can select own cotizacion_items" ON public.cotizacion_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = cotizacion_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own cotizacion_items" ON public.cotizacion_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = cotizacion_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own cotizacion_items" ON public.cotizacion_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = cotizacion_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own cotizacion_items" ON public.cotizacion_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = cotizacion_id AND c.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_cotizacion_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.subtotal := ROUND(NEW.cantidad * NEW.precio_unitario, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_cotizacion_item_subtotal_on_write ON public.cotizacion_items;
CREATE TRIGGER set_cotizacion_item_subtotal_on_write
  BEFORE INSERT OR UPDATE ON public.cotizacion_items
  FOR EACH ROW EXECUTE FUNCTION public.set_cotizacion_item_subtotal();

CREATE OR REPLACE FUNCTION public.recalcular_cotizacion_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_cotizacion_id UUID;
  nuevo_subtotal DECIMAL(12, 2);
BEGIN
  target_cotizacion_id := COALESCE(NEW.cotizacion_id, OLD.cotizacion_id);

  SELECT COALESCE(SUM(subtotal), 0)
  INTO nuevo_subtotal
  FROM public.cotizacion_items
  WHERE cotizacion_id = target_cotizacion_id;

  UPDATE public.cotizaciones
  SET
    subtotal = nuevo_subtotal,
    igv = ROUND(nuevo_subtotal * 0.18, 2),
    total = ROUND(nuevo_subtotal * 1.18, 2),
    updated_at = now()
  WHERE id = target_cotizacion_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_cotizacion_totales_on_items ON public.cotizacion_items;
CREATE TRIGGER recalcular_cotizacion_totales_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.cotizacion_items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_cotizacion_totales();
