-- Campos adicionales para el modal de nuevo producto

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS marca_modelo TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS afectacion_igv TEXT NOT NULL DEFAULT 'afecto'
  CHECK (afectacion_igv IN ('afecto', 'exonerado', 'inafecto'));
