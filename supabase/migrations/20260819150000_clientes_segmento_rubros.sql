ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_segmento_check;

UPDATE public.clientes
SET segmento = 'Otros'
WHERE segmento IS NULL
   OR segmento NOT IN (
     'Medicina',
     'Educación',
     'Construcción',
     'Ingeniería',
     'Gobierno',
     'Legal',
     'Banca y finanzas',
     'Minería',
     'Industria',
     'Comercio',
     'Logística',
     'Tecnología',
     'Servicios',
     'Otros'
   );

ALTER TABLE public.clientes
  ALTER COLUMN segmento SET DEFAULT 'Otros';

ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_segmento_check
  CHECK (segmento IN (
    'Medicina',
    'Educación',
    'Construcción',
    'Ingeniería',
    'Gobierno',
    'Legal',
    'Banca y finanzas',
    'Minería',
    'Industria',
    'Comercio',
    'Logística',
    'Tecnología',
    'Servicios',
    'Otros'
  ));
