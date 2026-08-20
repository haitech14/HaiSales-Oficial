ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS pais TEXT;

COMMENT ON COLUMN public.clientes.pais IS 'País del contacto (ej. Perú, Bolivia).';
