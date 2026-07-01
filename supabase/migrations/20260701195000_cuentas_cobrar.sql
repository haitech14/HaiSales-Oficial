-- Cuentas por cobrar y cobros

CREATE TABLE IF NOT EXISTS public.cuentas_cobrar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
  documento TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL,
  monto DECIMAL(12, 2) NOT NULL CHECK (monto >= 0),
  saldo_pendiente DECIMAL(12, 2) NOT NULL CHECK (saldo_pendiente >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'parcial', 'cobrado', 'vencido')),
  dias_mora INTEGER NOT NULL DEFAULT 0 CHECK (dias_mora >= 0),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, documento)
);

CREATE INDEX IF NOT EXISTS cuentas_cobrar_user_estado_idx
  ON public.cuentas_cobrar (user_id, estado);

CREATE INDEX IF NOT EXISTS cuentas_cobrar_user_vencimiento_idx
  ON public.cuentas_cobrar (user_id, fecha_vencimiento);

ALTER TABLE public.cuentas_cobrar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cuentas_cobrar" ON public.cuentas_cobrar;
DROP POLICY IF EXISTS "Users can insert own cuentas_cobrar" ON public.cuentas_cobrar;
DROP POLICY IF EXISTS "Users can update own cuentas_cobrar" ON public.cuentas_cobrar;
DROP POLICY IF EXISTS "Users can delete own cuentas_cobrar" ON public.cuentas_cobrar;

CREATE POLICY "Users can select own cuentas_cobrar" ON public.cuentas_cobrar
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cuentas_cobrar" ON public.cuentas_cobrar
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cuentas_cobrar" ON public.cuentas_cobrar
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cuentas_cobrar" ON public.cuentas_cobrar
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_cuentas_cobrar_updated_at ON public.cuentas_cobrar;
CREATE TRIGGER update_cuentas_cobrar_updated_at
  BEFORE UPDATE ON public.cuentas_cobrar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.cobros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuenta_cobrar_id UUID NOT NULL REFERENCES public.cuentas_cobrar(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
  medio_pago TEXT NOT NULL DEFAULT 'transferencia'
    CHECK (medio_pago IN ('efectivo', 'transferencia', 'tarjeta', 'yape', 'plin', 'otro')),
  referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cobros_cuenta_idx
  ON public.cobros (cuenta_cobrar_id, fecha DESC);

ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cobros" ON public.cobros;
DROP POLICY IF EXISTS "Users can insert own cobros" ON public.cobros;
DROP POLICY IF EXISTS "Users can update own cobros" ON public.cobros;
DROP POLICY IF EXISTS "Users can delete own cobros" ON public.cobros;

CREATE POLICY "Users can select own cobros" ON public.cobros
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cobros" ON public.cobros
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cobros" ON public.cobros
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cobros" ON public.cobros
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.aplicar_cobro_cuenta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nuevo_saldo DECIMAL(12, 2);
  nuevo_estado TEXT;
  fecha_venc DATE;
BEGIN
  SELECT saldo_pendiente - NEW.monto, fecha_vencimiento
  INTO nuevo_saldo, fecha_venc
  FROM public.cuentas_cobrar
  WHERE id = NEW.cuenta_cobrar_id
  FOR UPDATE;

  IF nuevo_saldo IS NULL THEN
    RAISE EXCEPTION 'Cuenta por cobrar no encontrada';
  END IF;

  IF nuevo_saldo < 0 THEN
    RAISE EXCEPTION 'El cobro excede el saldo pendiente';
  END IF;

  IF nuevo_saldo = 0 THEN
    nuevo_estado := 'cobrado';
  ELSIF nuevo_saldo < (SELECT monto FROM public.cuentas_cobrar WHERE id = NEW.cuenta_cobrar_id) THEN
    nuevo_estado := 'parcial';
  ELSE
    nuevo_estado := 'pendiente';
  END IF;

  IF fecha_venc < CURRENT_DATE AND nuevo_saldo > 0 THEN
    nuevo_estado := 'vencido';
  END IF;

  UPDATE public.cuentas_cobrar
  SET
    saldo_pendiente = nuevo_saldo,
    estado = nuevo_estado,
    dias_mora = GREATEST(0, CURRENT_DATE - fecha_venc),
    updated_at = now()
  WHERE id = NEW.cuenta_cobrar_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aplicar_cobro_cuenta_on_insert ON public.cobros;
CREATE TRIGGER aplicar_cobro_cuenta_on_insert
  AFTER INSERT ON public.cobros
  FOR EACH ROW EXECUTE FUNCTION public.aplicar_cobro_cuenta();
