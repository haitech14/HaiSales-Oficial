-- Perfil comercial: producción mensual y fecha toner (equipo se calcula desde guías)

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS produccion_mensual TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_toner DATE;
