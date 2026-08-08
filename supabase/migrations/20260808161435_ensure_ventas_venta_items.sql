-- Ensure ventas + venta_items exist for Nueva venta / picker de productos comprados

CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'confirmada', 'anulada')),
  moneda TEXT NOT NULL DEFAULT 'PEN',
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  igv DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  tipo_comprobante TEXT NOT NULL DEFAULT 'factura'
    CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_credito', 'nota_venta')),
  codigo_comprobante TEXT,
  estado_sunat TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado_sunat IN ('aceptado', 'pendiente', 'rechazado')),
  vendedor_nombre TEXT,
  vendedor_iniciales TEXT,
  tiene_cdr BOOLEAN NOT NULL DEFAULT false,
  cdr_url TEXT,
  cliente_nombre TEXT,
  cliente_ruc TEXT,
  hora_emision TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero),
  CONSTRAINT ventas_totales_check CHECK (abs(total - (subtotal + igv)) <= 0.02)
);

CREATE UNIQUE INDEX IF NOT EXISTS ventas_user_codigo_comprobante_idx
  ON public.ventas (user_id, codigo_comprobante)
  WHERE codigo_comprobante IS NOT NULL;

CREATE INDEX IF NOT EXISTS ventas_user_fecha_idx ON public.ventas (user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS ventas_user_estado_sunat_idx ON public.ventas (user_id, estado_sunat);
CREATE INDEX IF NOT EXISTS ventas_user_tipo_comprobante_idx ON public.ventas (user_id, tipo_comprobante);
CREATE INDEX IF NOT EXISTS ventas_user_cliente_idx ON public.ventas (user_id, cliente_id);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can insert own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can update own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can delete own ventas" ON public.ventas;

CREATE POLICY "Users can select own ventas" ON public.ventas
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own ventas" ON public.ventas
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own ventas" ON public.ventas
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own ventas" ON public.ventas
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventas TO authenticated;

DROP TRIGGER IF EXISTS update_ventas_updated_at ON public.ventas;
CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.venta_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12, 3) NOT NULL DEFAULT 1 CHECK (cantidad <> 0),
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venta_items_venta_idx ON public.venta_items (venta_id);

ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can insert own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can update own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can delete own venta_items" ON public.venta_items;

CREATE POLICY "Users can select own venta_items" ON public.venta_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can insert own venta_items" ON public.venta_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own venta_items" ON public.venta_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can delete own venta_items" ON public.venta_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venta_items TO authenticated;

CREATE OR REPLACE FUNCTION public.recalcular_venta_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_venta_id UUID;
  nuevo_subtotal DECIMAL(12, 2);
BEGIN
  target_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);

  SELECT COALESCE(SUM(subtotal), 0)
  INTO nuevo_subtotal
  FROM public.venta_items
  WHERE venta_id = target_venta_id;

  UPDATE public.ventas
  SET
    subtotal = nuevo_subtotal,
    igv = ROUND(nuevo_subtotal * 0.18, 2),
    total = ROUND(nuevo_subtotal * 1.18, 2),
    updated_at = now()
  WHERE id = target_venta_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_venta_totales_on_items ON public.venta_items;
CREATE TRIGGER recalcular_venta_totales_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.venta_items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_venta_totales();

CREATE OR REPLACE FUNCTION public.set_venta_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.subtotal := ROUND(NEW.cantidad * NEW.precio_unitario, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_venta_item_subtotal_on_write ON public.venta_items;
CREATE TRIGGER set_venta_item_subtotal_on_write
  BEFORE INSERT OR UPDATE ON public.venta_items
  FOR EACH ROW EXECUTE FUNCTION public.set_venta_item_subtotal();

NOTIFY pgrst, 'reload schema';
