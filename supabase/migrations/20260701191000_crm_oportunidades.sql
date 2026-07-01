-- CRM: oportunidades y actividades comerciales

CREATE TABLE IF NOT EXISTS public.oportunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  codigo TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_ruc TEXT,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  valor DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  etapa TEXT NOT NULL DEFAULT 'Prospectos'
    CHECK (etapa IN ('Prospectos', 'Calificación', 'Propuesta', 'Negociación', 'Cierre ganado', 'Perdidas')),
  probabilidad SMALLINT NOT NULL DEFAULT 0 CHECK (probabilidad >= 0 AND probabilidad <= 100),
  responsable_nombre TEXT NOT NULL,
  responsable_iniciales TEXT,
  fecha_oportunidad TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre_estimada DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo)
);

CREATE INDEX IF NOT EXISTS oportunidades_user_etapa_idx
  ON public.oportunidades (user_id, etapa);

CREATE INDEX IF NOT EXISTS oportunidades_user_responsable_idx
  ON public.oportunidades (user_id, responsable_nombre);

CREATE INDEX IF NOT EXISTS oportunidades_user_fecha_idx
  ON public.oportunidades (user_id, fecha_oportunidad DESC);

ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can insert own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can update own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can delete own oportunidades" ON public.oportunidades;

CREATE POLICY "Users can select own oportunidades" ON public.oportunidades
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own oportunidades" ON public.oportunidades
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own oportunidades" ON public.oportunidades
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own oportunidades" ON public.oportunidades
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_oportunidades_updated_at ON public.oportunidades;
CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.actividades_comerciales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  oportunidad_id UUID REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada', 'reunion', 'correo', 'seguimiento')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  titulo TEXT NOT NULL,
  fecha_programada TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS actividades_comerciales_user_tipo_idx
  ON public.actividades_comerciales (user_id, tipo, estado);

ALTER TABLE public.actividades_comerciales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own actividades_comerciales" ON public.actividades_comerciales;
DROP POLICY IF EXISTS "Users can insert own actividades_comerciales" ON public.actividades_comerciales;
DROP POLICY IF EXISTS "Users can update own actividades_comerciales" ON public.actividades_comerciales;
DROP POLICY IF EXISTS "Users can delete own actividades_comerciales" ON public.actividades_comerciales;

CREATE POLICY "Users can select own actividades_comerciales" ON public.actividades_comerciales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actividades_comerciales" ON public.actividades_comerciales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actividades_comerciales" ON public.actividades_comerciales
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own actividades_comerciales" ON public.actividades_comerciales
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_actividades_comerciales_updated_at ON public.actividades_comerciales;
CREATE TRIGGER update_actividades_comerciales_updated_at
  BEFORE UPDATE ON public.actividades_comerciales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
