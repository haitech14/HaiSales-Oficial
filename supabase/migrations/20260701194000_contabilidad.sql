-- Contabilidad: plan de cuentas, asientos y líneas

CREATE TABLE IF NOT EXISTS public.plan_cuentas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto')),
  nivel SMALLINT NOT NULL DEFAULT 1 CHECK (nivel > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo)
);

CREATE INDEX IF NOT EXISTS plan_cuentas_user_tipo_idx
  ON public.plan_cuentas (user_id, tipo);

ALTER TABLE public.plan_cuentas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own plan_cuentas" ON public.plan_cuentas;
DROP POLICY IF EXISTS "Users can insert own plan_cuentas" ON public.plan_cuentas;
DROP POLICY IF EXISTS "Users can update own plan_cuentas" ON public.plan_cuentas;
DROP POLICY IF EXISTS "Users can delete own plan_cuentas" ON public.plan_cuentas;

CREATE POLICY "Users can select own plan_cuentas" ON public.plan_cuentas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan_cuentas" ON public.plan_cuentas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plan_cuentas" ON public.plan_cuentas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own plan_cuentas" ON public.plan_cuentas
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_plan_cuentas_updated_at ON public.plan_cuentas;
CREATE TRIGGER update_plan_cuentas_updated_at
  BEFORE UPDATE ON public.plan_cuentas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.asientos_contables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_emision TIME,
  glosa TEXT,
  seccion TEXT NOT NULL DEFAULT 'asientos'
    CHECK (seccion IN ('asientos', 'libro-diario', 'balance', 'resultados', 'conciliacion')),
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('publicado', 'borrador', 'anulado')),
  documento_ref TEXT,
  total_debe DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_debe >= 0),
  total_haber DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_haber >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo)
);

CREATE INDEX IF NOT EXISTS asientos_contables_user_fecha_idx
  ON public.asientos_contables (user_id, fecha DESC);

CREATE INDEX IF NOT EXISTS asientos_contables_user_seccion_idx
  ON public.asientos_contables (user_id, seccion);

ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own asientos_contables" ON public.asientos_contables;
DROP POLICY IF EXISTS "Users can insert own asientos_contables" ON public.asientos_contables;
DROP POLICY IF EXISTS "Users can update own asientos_contables" ON public.asientos_contables;
DROP POLICY IF EXISTS "Users can delete own asientos_contables" ON public.asientos_contables;

CREATE POLICY "Users can select own asientos_contables" ON public.asientos_contables
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own asientos_contables" ON public.asientos_contables
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own asientos_contables" ON public.asientos_contables
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own asientos_contables" ON public.asientos_contables
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_asientos_contables_updated_at ON public.asientos_contables;
CREATE TRIGGER update_asientos_contables_updated_at
  BEFORE UPDATE ON public.asientos_contables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.asiento_lineas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asiento_id UUID NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_codigo TEXT NOT NULL,
  cuenta_nombre TEXT NOT NULL,
  descripcion TEXT,
  debe DECIMAL(12, 2) CHECK (debe IS NULL OR debe >= 0),
  haber DECIMAL(12, 2) CHECK (haber IS NULL OR haber >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (debe IS NOT NULL AND haber IS NULL AND debe > 0)
    OR (haber IS NOT NULL AND debe IS NULL AND haber > 0)
  )
);

CREATE INDEX IF NOT EXISTS asiento_lineas_asiento_idx
  ON public.asiento_lineas (asiento_id);

ALTER TABLE public.asiento_lineas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own asiento_lineas" ON public.asiento_lineas;
DROP POLICY IF EXISTS "Users can insert own asiento_lineas" ON public.asiento_lineas;
DROP POLICY IF EXISTS "Users can update own asiento_lineas" ON public.asiento_lineas;
DROP POLICY IF EXISTS "Users can delete own asiento_lineas" ON public.asiento_lineas;

CREATE POLICY "Users can select own asiento_lineas" ON public.asiento_lineas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.asientos_contables a
      WHERE a.id = asiento_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own asiento_lineas" ON public.asiento_lineas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asientos_contables a
      WHERE a.id = asiento_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own asiento_lineas" ON public.asiento_lineas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.asientos_contables a
      WHERE a.id = asiento_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own asiento_lineas" ON public.asiento_lineas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.asientos_contables a
      WHERE a.id = asiento_id AND a.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.recalcular_asiento_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_asiento_id UUID;
  sum_debe DECIMAL(12, 2);
  sum_haber DECIMAL(12, 2);
BEGIN
  target_asiento_id := COALESCE(NEW.asiento_id, OLD.asiento_id);

  SELECT COALESCE(SUM(debe), 0), COALESCE(SUM(haber), 0)
  INTO sum_debe, sum_haber
  FROM public.asiento_lineas
  WHERE asiento_id = target_asiento_id;

  UPDATE public.asientos_contables
  SET
    total_debe = sum_debe,
    total_haber = sum_haber,
    updated_at = now()
  WHERE id = target_asiento_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_asiento_totales_on_lineas ON public.asiento_lineas;
CREATE TRIGGER recalcular_asiento_totales_on_lineas
  AFTER INSERT OR UPDATE OR DELETE ON public.asiento_lineas
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_asiento_totales();
