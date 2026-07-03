-- Perfil comercial adicional de clientes

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cumpleanos DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modelos_interes TEXT;
