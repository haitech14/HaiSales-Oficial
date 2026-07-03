ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS hora_refrigerio TIME;

ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS en_planilla BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS sistema_pensiones TEXT
    CHECK (sistema_pensiones IS NULL OR sistema_pensiones IN ('afp', 'onp'));

ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS seguro_salud TEXT
    CHECK (seguro_salud IS NULL OR seguro_salud IN ('essalud', 'sis'));
