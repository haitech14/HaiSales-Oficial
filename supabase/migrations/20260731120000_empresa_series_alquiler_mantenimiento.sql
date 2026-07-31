-- Crea empresa_config si el proyecto aún no tiene el schema HaiSales,
-- y agrega las series de alquiler / plan de mantenimiento.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.empresa_config (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social TEXT,
  nombre_comercial TEXT,
  ruc TEXT,
  direccion TEXT,
  telefono_prefijo TEXT NOT NULL DEFAULT '+51',
  telefono TEXT,
  email TEXT,
  ciudad TEXT,
  pais TEXT NOT NULL DEFAULT 'Perú',
  tipo_contribuyente TEXT,
  gerente_general TEXT,
  impuesto_renta NUMERIC(4, 2) NOT NULL DEFAULT 1.5,
  logo_url TEXT,
  zona_horaria TEXT NOT NULL DEFAULT 'America/Lima',
  moneda TEXT NOT NULL DEFAULT 'PEN',
  monedas JSONB NOT NULL DEFAULT '["PEN"]'::jsonb,
  igv_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 18,
  regimen_tributario TEXT DEFAULT 'regimen_general',
  serie_factura TEXT DEFAULT 'F001',
  serie_boleta TEXT DEFAULT 'B001',
  serie_nota_credito TEXT DEFAULT 'FC01',
  serie_nota_debito TEXT DEFAULT 'FD01',
  serie_nota_venta TEXT DEFAULT 'NV01',
  serie_guia_remision TEXT DEFAULT 'T001',
  serie_proforma TEXT DEFAULT 'C001-',
  serie_orden_compra TEXT DEFAULT 'OC001',
  serie_orden_pedido TEXT DEFAULT 'OP001',
  serie_orden_servicio TEXT DEFAULT 'OS001',
  serie_orden_alquiler TEXT DEFAULT 'OA001',
  serie_orden_plan_mantenimiento TEXT DEFAULT 'OM001',
  sedes JSONB NOT NULL DEFAULT '[]'::jsonb,
  contador_nombre TEXT,
  contador_email TEXT,
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  demo_cleanup_dismissed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_alquiler TEXT DEFAULT 'OA001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_orden_plan_mantenimiento TEXT DEFAULT 'OM001';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_venta TEXT DEFAULT 'NV01';

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS demo_cleanup_dismissed BOOLEAN NOT NULL DEFAULT false;

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
