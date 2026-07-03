-- Datos fiscales extendidos: renta, contribuyente, ubicación, logo y zona horaria

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
