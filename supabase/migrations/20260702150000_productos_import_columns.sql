-- Importación legacy de productos / inventario

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_mayorista DECIMAL(12, 2);
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_tecnico DECIMAL(12, 2);
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_distribuidor DECIMAL(12, 2);

CREATE TABLE IF NOT EXISTS public.productos_legacy_import (
  legacy_id TEXT NOT NULL PRIMARY KEY,
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  marca TEXT,
  categoria TEXT NOT NULL DEFAULT 'General',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  costo DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio_mayorista DECIMAL(12, 2),
  precio_tecnico DECIMAL(12, 2),
  precio_distribuidor DECIMAL(12, 2),
  moneda TEXT NOT NULL DEFAULT 'USD',
  tipo TEXT NOT NULL DEFAULT 'product',
  unidad TEXT NOT NULL DEFAULT 'und',
  almacen TEXT NOT NULL DEFAULT 'Almacén Central',
  afectacion_igv TEXT NOT NULL DEFAULT 'afecto',
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.productos_legacy_import ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read productos legacy import" ON public.productos_legacy_import;
CREATE POLICY "Authenticated can read productos legacy import" ON public.productos_legacy_import
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.import_productos_legacy_for_user(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.almacenes (user_id, nombre, ubicacion, activo)
  SELECT DISTINCT
    p_user_id,
    src.almacen,
    'Importado desde catálogo legacy',
    true
  FROM public.productos_legacy_import src
  WHERE src.tipo <> 'service'
  ON CONFLICT (user_id, nombre) DO NOTHING;

  INSERT INTO public.productos (
    user_id,
    sku,
    nombre,
    descripcion,
    categoria,
    almacen,
    costo,
    precio,
    precio_mayorista,
    precio_tecnico,
    precio_distribuidor,
    moneda,
    stock,
    unidad,
    tipo,
    activo,
    stock_minimo,
    marca_modelo,
    afectacion_igv,
    ultimo_movimiento_at
  )
  SELECT
    p_user_id,
    src.sku,
    src.nombre,
    src.descripcion,
    src.categoria,
    CASE WHEN src.tipo = 'service' THEN 'Almacén Central' ELSE src.almacen END,
    src.costo,
    src.precio,
    src.precio_mayorista,
    src.precio_tecnico,
    src.precio_distribuidor,
    src.moneda,
    CASE WHEN src.tipo = 'service' THEN 0 ELSE src.stock END,
    src.unidad,
    src.tipo,
    src.activo,
    CASE
      WHEN src.tipo = 'service' THEN 0
      WHEN src.categoria ILIKE '%Toner%' OR src.categoria ILIKE '%Repuesto%' THEN 5
      ELSE 10
    END,
    src.marca,
    src.afectacion_igv,
    CASE
      WHEN src.stock > 0 AND src.tipo <> 'service' THEN now()
      ELSE NULL
    END
  FROM public.productos_legacy_import src
  ON CONFLICT (user_id, sku)
  DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria,
    almacen = EXCLUDED.almacen,
    costo = EXCLUDED.costo,
    precio = EXCLUDED.precio,
    precio_mayorista = EXCLUDED.precio_mayorista,
    precio_tecnico = EXCLUDED.precio_tecnico,
    precio_distribuidor = EXCLUDED.precio_distribuidor,
    moneda = EXCLUDED.moneda,
    stock = EXCLUDED.stock,
    unidad = EXCLUDED.unidad,
    tipo = EXCLUDED.tipo,
    activo = EXCLUDED.activo,
    stock_minimo = EXCLUDED.stock_minimo,
    marca_modelo = EXCLUDED.marca_modelo,
    afectacion_igv = EXCLUDED.afectacion_igv,
    ultimo_movimiento_at = COALESCE(EXCLUDED.ultimo_movimiento_at, public.productos.ultimo_movimiento_at),
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.kardex_movimientos (
    user_id,
    producto_id,
    almacen_origen,
    tipo,
    cantidad,
    unidad,
    costo_unitario,
    costo_total,
    motivo,
    responsable,
    documento_referencia,
    estado,
    fecha_movimiento
  )
  SELECT
    p_user_id,
    p.id,
    p.almacen,
    'entrada',
    p.stock,
    p.unidad,
    COALESCE(p.costo, 0),
    p.stock * COALESCE(p.costo, 0),
    'Stock inicial importado',
    'Sistema',
    'IMPORT-LEGACY',
    'completado',
    CURRENT_DATE
  FROM public.productos p
  WHERE p.user_id = p_user_id
    AND p.stock > 0
    AND p.tipo <> 'service'
    AND NOT EXISTS (
      SELECT 1
      FROM public.kardex_movimientos km
      WHERE km.user_id = p_user_id
        AND km.producto_id = p.id
        AND km.documento_referencia = 'IMPORT-LEGACY'
    );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_productos_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_productos_legacy_for_user(UUID) TO authenticated;
