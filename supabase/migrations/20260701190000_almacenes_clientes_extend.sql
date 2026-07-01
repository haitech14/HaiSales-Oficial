-- Almacenes + extensión de clientes para CRM comercial

CREATE TABLE IF NOT EXISTS public.almacenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  responsable TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, nombre)
);

CREATE INDEX IF NOT EXISTS almacenes_user_nombre_lower_idx
  ON public.almacenes (user_id, lower(nombre));

ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own almacenes" ON public.almacenes;
DROP POLICY IF EXISTS "Users can insert own almacenes" ON public.almacenes;
DROP POLICY IF EXISTS "Users can update own almacenes" ON public.almacenes;
DROP POLICY IF EXISTS "Users can delete own almacenes" ON public.almacenes;

CREATE POLICY "Users can select own almacenes" ON public.almacenes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own almacenes" ON public.almacenes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own almacenes" ON public.almacenes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own almacenes" ON public.almacenes
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_almacenes_updated_at ON public.almacenes;
CREATE TRIGGER update_almacenes_updated_at
  BEFORE UPDATE ON public.almacenes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extensión clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contacto_cargo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS segmento TEXT NOT NULL DEFAULT 'Otros'
  CHECK (segmento IN ('Corporativo', 'PYME', 'Minorista', 'Prospecto', 'Otros'));
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado_comercial TEXT NOT NULL DEFAULT 'activo'
  CHECK (estado_comercial IN ('activo', 'prospecto', 'con_deuda', 'inactivo'));
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ejecutivo_nombre TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ejecutivo_iniciales TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS distrito TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS clientes_user_estado_comercial_idx
  ON public.clientes (user_id, estado_comercial);

CREATE INDEX IF NOT EXISTS clientes_user_segmento_idx
  ON public.clientes (user_id, segmento);
