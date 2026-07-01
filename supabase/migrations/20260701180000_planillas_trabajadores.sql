-- Planillas: trabajadores y ficha laboral

CREATE TABLE IF NOT EXISTS public.trabajadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT,
  dni TEXT NOT NULL,
  nombres_apellidos TEXT NOT NULL,
  cargo TEXT NOT NULL,
  area TEXT NOT NULL,
  fecha_ingreso DATE,
  tipo_contrato TEXT,
  sueldo_basico DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (sueldo_basico >= 0),
  regimen_laboral TEXT,
  banco TEXT,
  cuenta_sueldo TEXT,
  supervisor TEXT,
  estado TEXT NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'vacaciones', 'cesado', 'asistencia_pendiente')),
  turno TEXT,
  hora_entrada TIME,
  hora_salida TIME,
  dias_laborables TEXT,
  dni_validado BOOLEAN NOT NULL DEFAULT false,
  es_borrador BOOLEAN NOT NULL DEFAULT false,
  asistencia_dias INTEGER NOT NULL DEFAULT 0 CHECK (asistencia_dias >= 0),
  asistencia_total INTEGER NOT NULL DEFAULT 26 CHECK (asistencia_total > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dni)
);

CREATE INDEX IF NOT EXISTS trabajadores_user_estado_idx
  ON public.trabajadores (user_id, estado);

CREATE INDEX IF NOT EXISTS trabajadores_user_area_idx
  ON public.trabajadores (user_id, area);

CREATE INDEX IF NOT EXISTS trabajadores_user_nombre_lower_idx
  ON public.trabajadores (user_id, lower(nombres_apellidos));

ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Users can insert own trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Users can update own trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Users can delete own trabajadores" ON public.trabajadores;

CREATE POLICY "Users can select own trabajadores" ON public.trabajadores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trabajadores" ON public.trabajadores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trabajadores" ON public.trabajadores
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trabajadores" ON public.trabajadores
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_trabajadores_updated_at ON public.trabajadores;
CREATE TRIGGER update_trabajadores_updated_at
  BEFORE UPDATE ON public.trabajadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
