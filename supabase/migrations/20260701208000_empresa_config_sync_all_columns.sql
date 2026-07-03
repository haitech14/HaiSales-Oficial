-- Sincroniza todas las columnas de empresa_config (ejecutar si faltan migraciones 202020–202070)

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

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS telefono_prefijo TEXT NOT NULL DEFAULT '+51';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS monedas JSONB NOT NULL DEFAULT '["PEN"]'::jsonb;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_guia_remision TEXT DEFAULT 'T001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_proforma TEXT DEFAULT 'PR001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS sedes JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS impuesto_renta NUMERIC(4, 2) NOT NULL DEFAULT 1.5;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS tipo_contribuyente TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS ciudad TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS pais TEXT NOT NULL DEFAULT 'Perú';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS zona_horaria TEXT NOT NULL DEFAULT 'America/Lima';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_credito TEXT DEFAULT 'FC01';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_debito TEXT DEFAULT 'FD01';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'regimen_general';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS gerente_general TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS nombre_comercial TEXT;

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_compra TEXT DEFAULT 'OC001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_pedido TEXT DEFAULT 'OP001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_servicio TEXT DEFAULT 'OS001';

UPDATE public.empresa_config
SET monedas = jsonb_build_array(moneda)
WHERE monedas IS NULL OR monedas = '[]'::jsonb;

UPDATE public.empresa_config
SET regimen_tributario = 'regimen_general'
WHERE regimen_tributario IS NULL;

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'empresa-logos',
  'empresa-logos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own empresa logo" ON storage.objects;
DROP POLICY IF EXISTS "Users update own empresa logo" ON storage.objects;
DROP POLICY IF EXISTS "Public read empresa logos" ON storage.objects;

CREATE POLICY "Users upload own empresa logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'empresa-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own empresa logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'empresa-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read empresa logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'empresa-logos');
