CREATE TABLE IF NOT EXISTS public.whatsapp_listas_precios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot IN (1, 2)),
  nombre text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot)
);

ALTER TABLE public.whatsapp_listas_precios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own listas precios" ON public.whatsapp_listas_precios;
DROP POLICY IF EXISTS "Users can insert own listas precios" ON public.whatsapp_listas_precios;
DROP POLICY IF EXISTS "Users can update own listas precios" ON public.whatsapp_listas_precios;
DROP POLICY IF EXISTS "Users can delete own listas precios" ON public.whatsapp_listas_precios;

CREATE POLICY "Users can select own listas precios"
  ON public.whatsapp_listas_precios FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own listas precios"
  ON public.whatsapp_listas_precios FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own listas precios"
  ON public.whatsapp_listas_precios FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own listas precios"
  ON public.whatsapp_listas_precios FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_whatsapp_listas_precios_updated_at ON public.whatsapp_listas_precios;
CREATE TRIGGER update_whatsapp_listas_precios_updated_at
  BEFORE UPDATE ON public.whatsapp_listas_precios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_listas_precios TO authenticated;
GRANT ALL ON TABLE public.whatsapp_listas_precios TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listas-precios',
  'listas-precios',
  true,
  20971520,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own listas precios" ON storage.objects;
DROP POLICY IF EXISTS "Users update own listas precios" ON storage.objects;
DROP POLICY IF EXISTS "Users select own listas precios" ON storage.objects;
DROP POLICY IF EXISTS "Public read listas precios" ON storage.objects;

CREATE POLICY "Users upload own listas precios"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listas-precios'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users update own listas precios"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listas-precios'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'listas-precios'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users select own listas precios"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listas-precios'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Public read listas precios"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'listas-precios');
