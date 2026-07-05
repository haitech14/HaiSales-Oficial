-- Corrige import legacy: ultimo_movimiento_at no puede ser NULL en productos

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

  IF NOT EXISTS (SELECT 1 FROM public.productos_legacy_import LIMIT 1) THEN
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
    now()
  FROM (
    SELECT DISTINCT ON (sku) *
    FROM public.productos_legacy_import
    ORDER BY sku, legacy_id
  ) src
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
    ultimo_movimiento_at = COALESCE(public.productos.ultimo_movimiento_at, EXCLUDED.ultimo_movimiento_at),
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_productos_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_productos_legacy_for_user(UUID) TO authenticated;
