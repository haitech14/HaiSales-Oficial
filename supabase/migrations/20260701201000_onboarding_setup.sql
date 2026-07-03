-- Onboarding: flag de setup completado y datos del contador
-- Crea empresa_config si la migración 20260701200000 aún no se aplicó.

CREATE TABLE IF NOT EXISTS public.empresa_config (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social TEXT,
  ruc TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  igv_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 18,
  serie_factura TEXT DEFAULT 'F001',
  serie_boleta TEXT DEFAULT 'B001',
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  contador_nombre TEXT,
  contador_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS contador_nombre TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS contador_email TEXT;

ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own empresa config" ON public.empresa_config;
DROP POLICY IF EXISTS "Users can insert own empresa config" ON public.empresa_config;
DROP POLICY IF EXISTS "Users can update own empresa config" ON public.empresa_config;

CREATE POLICY "Users can select own empresa config" ON public.empresa_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own empresa config" ON public.empresa_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own empresa config" ON public.empresa_config
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_empresa_config_updated_at ON public.empresa_config;
CREATE TRIGGER update_empresa_config_updated_at
  BEFORE UPDATE ON public.empresa_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.empresa_config
SET setup_completed = true
WHERE setup_completed = false
  AND razon_social IS NOT NULL
  AND trim(razon_social) <> ''
  AND ruc IS NOT NULL
  AND trim(ruc) <> '';
