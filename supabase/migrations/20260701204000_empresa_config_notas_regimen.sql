-- Series de notas y régimen tributario

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_credito TEXT DEFAULT 'FC01';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_debito TEXT DEFAULT 'FD01';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'regimen_general';
