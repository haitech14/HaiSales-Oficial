-- Kardex, tesorería, configuración empresa y roles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'admin'
  CHECK (rol IN ('admin', 'vendedor', 'contador'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS public.kardex_movimientos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  almacen_origen TEXT,
  almacen_destino TEXT,
  ubicacion_origen TEXT,
  ubicacion_destino TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'transferencia')),
  cantidad NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'UND',
  costo_unitario NUMERIC(12, 2),
  costo_total NUMERIC(12, 2),
  motivo TEXT,
  responsable TEXT,
  documento_referencia TEXT,
  estado TEXT NOT NULL DEFAULT 'completado' CHECK (estado IN ('borrador', 'completado')),
  fecha_movimiento DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kardex_movimientos_user_fecha_idx
  ON public.kardex_movimientos (user_id, fecha_movimiento DESC);

ALTER TABLE public.kardex_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own kardex" ON public.kardex_movimientos;
DROP POLICY IF EXISTS "Users can insert own kardex" ON public.kardex_movimientos;

CREATE POLICY "Users can select own kardex" ON public.kardex_movimientos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kardex" ON public.kardex_movimientos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cuentas_tesoreria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  numero_cuenta TEXT,
  tipo TEXT NOT NULL DEFAULT 'banco' CHECK (tipo IN ('banco', 'caja')),
  banco TEXT,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  saldo_actual NUMERIC(14, 2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, nombre)
);

ALTER TABLE public.cuentas_tesoreria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cuentas tesoreria" ON public.cuentas_tesoreria;
DROP POLICY IF EXISTS "Users can insert own cuentas tesoreria" ON public.cuentas_tesoreria;
DROP POLICY IF EXISTS "Users can update own cuentas tesoreria" ON public.cuentas_tesoreria;

CREATE POLICY "Users can select own cuentas tesoreria" ON public.cuentas_tesoreria
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cuentas tesoreria" ON public.cuentas_tesoreria
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cuentas tesoreria" ON public.cuentas_tesoreria
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_cuentas_tesoreria_updated_at ON public.cuentas_tesoreria;
CREATE TRIGGER update_cuentas_tesoreria_updated_at
  BEFORE UPDATE ON public.cuentas_tesoreria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.movimientos_tesoreria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuenta_id UUID NOT NULL REFERENCES public.cuentas_tesoreria(id) ON DELETE CASCADE,
  cuenta_destino_id UUID REFERENCES public.cuentas_tesoreria(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'transferencia')),
  documento TEXT,
  concepto TEXT NOT NULL,
  monto_ingreso NUMERIC(14, 2),
  monto_egreso NUMERIC(14, 2),
  saldo_posterior NUMERIC(14, 2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'conciliado')),
  responsable_nombre TEXT,
  responsable_iniciales TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT (now() AT TIME ZONE 'America/Lima')::time,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movimientos_tesoreria_user_fecha_idx
  ON public.movimientos_tesoreria (user_id, fecha DESC, hora DESC);

ALTER TABLE public.movimientos_tesoreria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own movimientos tesoreria" ON public.movimientos_tesoreria;
DROP POLICY IF EXISTS "Users can insert own movimientos tesoreria" ON public.movimientos_tesoreria;
DROP POLICY IF EXISTS "Users can update own movimientos tesoreria" ON public.movimientos_tesoreria;

CREATE POLICY "Users can select own movimientos tesoreria" ON public.movimientos_tesoreria
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movimientos tesoreria" ON public.movimientos_tesoreria
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own movimientos tesoreria" ON public.movimientos_tesoreria
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.empresa_config (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social TEXT,
  ruc TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  igv_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 18,
  serie_factura TEXT DEFAULT 'F001',
  serie_boleta TEXT DEFAULT 'B001',
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  contador_nombre TEXT,
  contador_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own empresa config" ON public.empresa_config;
DROP POLICY IF EXISTS "Users can insert own empresa config" ON public.empresa_config;
DROP POLICY IF EXISTS "Users can update own empresa config" ON public.empresa_config;

CREATE POLICY "Users can select own empresa config" ON public.empresa_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own empresa config" ON public.empresa_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own empresa config" ON public.empresa_config
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_empresa_config_updated_at ON public.empresa_config;
CREATE TRIGGER update_empresa_config_updated_at
  BEFORE UPDATE ON public.empresa_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
