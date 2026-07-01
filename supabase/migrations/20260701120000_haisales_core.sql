-- HaiSales: esquema base de ventas (Perú)
-- Tablas: perfiles de vendedor, clientes, productos, ventas y detalle

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Perfil del vendedor / usuario de la app
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ruc TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clientes
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

CREATE INDEX IF NOT EXISTS clientes_user_razon_lower_idx
  ON public.clientes (user_id, lower(razon_social));

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

-- Catálogo de productos
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sku)
);

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

-- Ventas (cabecera)
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'confirmada', 'anulada')),
  moneda TEXT NOT NULL DEFAULT 'PEN',
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  igv DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (igv >= 0),
  total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero)
);

CREATE INDEX IF NOT EXISTS ventas_user_fecha_idx ON public.ventas (user_id, fecha DESC);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can insert own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can update own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can delete own ventas" ON public.ventas;

CREATE POLICY "Users can select own ventas" ON public.ventas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ventas" ON public.ventas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ventas" ON public.ventas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ventas" ON public.ventas
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ventas_updated_at ON public.ventas;
CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Detalle de venta
CREATE TABLE IF NOT EXISTS public.venta_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12, 3) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venta_items_venta_idx ON public.venta_items (venta_id);

ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can insert own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can update own venta_items" ON public.venta_items;
DROP POLICY IF EXISTS "Users can delete own venta_items" ON public.venta_items;

CREATE POLICY "Users can select own venta_items" ON public.venta_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own venta_items" ON public.venta_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own venta_items" ON public.venta_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own venta_items" ON public.venta_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.user_id = auth.uid()
    )
  );

-- Recalcula totales de la venta al modificar ítems
CREATE OR REPLACE FUNCTION public.recalcular_venta_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_venta_id UUID;
  nuevo_subtotal DECIMAL(12, 2);
BEGIN
  target_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);

  SELECT COALESCE(SUM(subtotal), 0)
  INTO nuevo_subtotal
  FROM public.venta_items
  WHERE venta_id = target_venta_id;

  UPDATE public.ventas
  SET
    subtotal = nuevo_subtotal,
    igv = ROUND(nuevo_subtotal * 0.18, 2),
    total = ROUND(nuevo_subtotal * 1.18, 2),
    updated_at = now()
  WHERE id = target_venta_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_venta_totales_on_items ON public.venta_items;
CREATE TRIGGER recalcular_venta_totales_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.venta_items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_venta_totales();

-- Asegura subtotal por línea
CREATE OR REPLACE FUNCTION public.set_venta_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.subtotal := ROUND(NEW.cantidad * NEW.precio_unitario, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_venta_item_subtotal_on_write ON public.venta_items;
CREATE TRIGGER set_venta_item_subtotal_on_write
  BEFORE INSERT OR UPDATE ON public.venta_items
  FOR EACH ROW EXECUTE FUNCTION public.set_venta_item_subtotal();
