-- Ventas / comprobantes electrónicos (SUNAT)

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS tipo_comprobante TEXT NOT NULL DEFAULT 'factura'
  CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_credito'));

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS codigo_comprobante TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS estado_sunat TEXT NOT NULL DEFAULT 'pendiente'
  CHECK (estado_sunat IN ('aceptado', 'pendiente', 'rechazado'));

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS vendedor_nombre TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS vendedor_iniciales TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS tiene_cdr BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS cdr_url TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS cliente_ruc TEXT;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS hora_emision TIME;

CREATE UNIQUE INDEX IF NOT EXISTS ventas_user_codigo_comprobante_idx
  ON public.ventas (user_id, codigo_comprobante)
  WHERE codigo_comprobante IS NOT NULL;

CREATE INDEX IF NOT EXISTS ventas_user_estado_sunat_idx
  ON public.ventas (user_id, estado_sunat);

CREATE INDEX IF NOT EXISTS ventas_user_tipo_comprobante_idx
  ON public.ventas (user_id, tipo_comprobante);

CREATE INDEX IF NOT EXISTS ventas_user_fecha_idx
  ON public.ventas (user_id, fecha DESC);
