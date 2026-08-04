-- Ensure ERP clientes/productos tables used by HaiSales app exist alongside POS schema

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social TEXT NOT NULL,
  ruc TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_cliente TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contacto_cargo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS segmento TEXT NOT NULL DEFAULT 'Otros';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado_comercial TEXT NOT NULL DEFAULT 'activo';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ejecutivo_nombre TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ejecutivo_iniciales TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS distrito TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cumpleanos DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modelos_interes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS produccion_mensual TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_toner DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS source_system TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS source_id TEXT;

CREATE INDEX IF NOT EXISTS clientes_user_razon_lower_idx ON public.clientes (user_id, lower(razon_social));
CREATE UNIQUE INDEX IF NOT EXISTS clientes_user_source_unique_idx
  ON public.clientes (user_id, source_system, source_id)
  WHERE source_system IS NOT NULL AND source_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_user_ruc_unique_idx
  ON public.clientes (user_id, ruc)
  WHERE ruc IS NOT NULL AND btrim(ruc) <> '';

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can update own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete own clientes" ON public.clientes;

CREATE POLICY "Users can select own clientes" ON public.clientes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clientes" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clientes" ON public.clientes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clientes" ON public.clientes
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unidad TEXT NOT NULL DEFAULT 'und',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS marca TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS source_system TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'PEN';

CREATE UNIQUE INDEX IF NOT EXISTS productos_user_sku_unique_idx
  ON public.productos (user_id, sku)
  WHERE sku IS NOT NULL AND btrim(sku) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS productos_user_source_unique_idx
  ON public.productos (user_id, source_system, source_id)
  WHERE source_system IS NOT NULL AND source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS productos_user_nombre_lower_idx
  ON public.productos (user_id, lower(nombre));

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own productos" ON public.productos;
DROP POLICY IF EXISTS "Users can insert own productos" ON public.productos;
DROP POLICY IF EXISTS "Users can update own productos" ON public.productos;
DROP POLICY IF EXISTS "Users can delete own productos" ON public.productos;

CREATE POLICY "Users can select own productos" ON public.productos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own productos" ON public.productos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own productos" ON public.productos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own productos" ON public.productos
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.productos TO service_role;
