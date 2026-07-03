-- Importación histórica de ventas por ítem (líneas de comprobante)

CREATE TABLE IF NOT EXISTS public.venta_legacy_import_items (
  id BIGSERIAL PRIMARY KEY,
  codigo_comprobante TEXT NOT NULL,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL,
  tipo_comprobante TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero_correlativo INTEGER NOT NULL,
  cliente_ruc TEXT,
  cliente_nombre TEXT NOT NULL,
  sucursal TEXT,
  categoria TEXT,
  tipo_producto TEXT,
  subtipo TEXT,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(14, 4) NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'UNIDAD',
  precio_unitario NUMERIC(14, 4) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  periodo_mes TEXT NOT NULL,
  fuente_archivo TEXT NOT NULL,
  linea_orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS venta_legacy_import_items_comprobante_idx
  ON public.venta_legacy_import_items (codigo_comprobante);

ALTER TABLE public.venta_legacy_import_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read venta items legacy import" ON public.venta_legacy_import_items;
CREATE POLICY "Authenticated can read venta items legacy import" ON public.venta_legacy_import_items
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.import_venta_items_legacy_for_user(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_header RECORD;
  v_item RECORD;
  v_venta_id UUID;
  v_producto_id UUID;
  v_almacen TEXT;
  v_costo NUMERIC;
  v_stock NUMERIC;
  v_subtotal NUMERIC;
  v_igv NUMERIC;
  v_modelos TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.venta_legacy_import_items LIMIT 1) THEN
    RETURN 0;
  END IF;

  FOR v_header IN
    SELECT DISTINCT ON (src.codigo_comprobante)
      src.codigo_comprobante,
      src.numero,
      src.fecha,
      src.tipo_comprobante,
      src.serie,
      src.numero_correlativo,
      src.cliente_ruc,
      src.cliente_nombre,
      src.sucursal,
      src.periodo_mes,
      src.fuente_archivo
    FROM public.venta_legacy_import_items src
    ORDER BY src.codigo_comprobante, src.linea_orden
  LOOP
    INSERT INTO public.ventas (
      user_id,
      cliente_id,
      numero,
      fecha,
      estado,
      moneda,
      subtotal,
      igv,
      total,
      notas,
      tipo_comprobante,
      codigo_comprobante,
      estado_sunat,
      vendedor_nombre,
      vendedor_iniciales,
      tiene_cdr,
      cliente_nombre,
      cliente_ruc
    )
    VALUES (
      p_user_id,
      (
        SELECT c.id
        FROM public.clientes c
        WHERE c.user_id = p_user_id
          AND v_header.cliente_ruc IS NOT NULL
          AND btrim(v_header.cliente_ruc) <> ''
          AND c.ruc = v_header.cliente_ruc
        LIMIT 1
      ),
      v_header.numero,
      v_header.fecha,
      'confirmada',
      'PEN',
      0,
      0,
      0,
      'Fuente: ' || v_header.fuente_archivo || ' · Periodo: ' || v_header.periodo_mes,
      v_header.tipo_comprobante,
      v_header.codigo_comprobante,
      'aceptado',
      'Sin asignar',
      'SA',
      true,
      v_header.cliente_nombre,
      v_header.cliente_ruc
    )
    ON CONFLICT (user_id, codigo_comprobante) WHERE codigo_comprobante IS NOT NULL
    DO UPDATE SET
      cliente_id = COALESCE(EXCLUDED.cliente_id, public.ventas.cliente_id),
      cliente_nombre = EXCLUDED.cliente_nombre,
      cliente_ruc = EXCLUDED.cliente_ruc,
      fecha = EXCLUDED.fecha,
      tipo_comprobante = EXCLUDED.tipo_comprobante,
      updated_at = now()
    RETURNING id INTO v_venta_id;

    IF v_venta_id IS NULL THEN
      SELECT v.id INTO v_venta_id
      FROM public.ventas v
      WHERE v.user_id = p_user_id
        AND v.codigo_comprobante = v_header.codigo_comprobante
      LIMIT 1;
    END IF;

    DELETE FROM public.venta_items WHERE venta_id = v_venta_id;

    v_subtotal := 0;
    v_igv := 0;

    FOR v_item IN
      SELECT *
      FROM public.venta_legacy_import_items
      WHERE codigo_comprobante = v_header.codigo_comprobante
      ORDER BY linea_orden, id
    LOOP
      v_producto_id := NULL;
      v_almacen := COALESCE(v_item.sucursal, v_header.sucursal, 'Almacén Principal');
      v_costo := 0;
      v_stock := 0;

      IF v_item.codigo IS NOT NULL AND btrim(v_item.codigo) <> '' THEN
        SELECT p.id, p.almacen, COALESCE(p.costo, 0), p.stock
        INTO v_producto_id, v_almacen, v_costo, v_stock
        FROM public.productos p
        WHERE p.user_id = p_user_id AND upper(p.sku) = upper(btrim(v_item.codigo))
        LIMIT 1;
      END IF;

      IF v_producto_id IS NULL AND v_item.descripcion IS NOT NULL THEN
        SELECT p.id, p.almacen, COALESCE(p.costo, 0), p.stock
        INTO v_producto_id, v_almacen, v_costo, v_stock
        FROM public.productos p
        WHERE p.user_id = p_user_id
          AND p.nombre ILIKE '%' || left(v_item.descripcion, 40) || '%'
        LIMIT 1;
      END IF;

      INSERT INTO public.venta_items (
        venta_id,
        producto_id,
        descripcion,
        cantidad,
        precio_unitario,
        subtotal
      ) VALUES (
        v_venta_id,
        v_producto_id,
        v_item.descripcion,
        v_item.cantidad,
        abs(v_item.precio_unitario),
        v_item.subtotal
      );

      v_subtotal := v_subtotal + v_item.subtotal;

      IF v_producto_id IS NOT NULL AND v_item.cantidad > 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.kardex_movimientos km
          WHERE km.user_id = p_user_id
            AND km.producto_id = v_producto_id
            AND km.documento_referencia = v_header.codigo_comprobante
            AND km.tipo = 'salida'
        ) THEN
          INSERT INTO public.kardex_movimientos (
            user_id, producto_id, almacen_origen, tipo, cantidad, unidad,
            costo_unitario, costo_total, motivo, responsable,
            documento_referencia, estado, fecha_movimiento
          ) VALUES (
            p_user_id, v_producto_id, v_almacen, 'salida', v_item.cantidad, v_item.unidad,
            v_costo, v_item.cantidad * v_costo,
            'Venta ' || v_header.codigo_comprobante,
            COALESCE(v_header.cliente_nombre, 'Ventas'),
            v_header.codigo_comprobante, 'completado', v_header.fecha
          );

          UPDATE public.productos
          SET stock = GREATEST(0, v_stock - v_item.cantidad),
              ultimo_movimiento_at = now()
          WHERE id = v_producto_id AND user_id = p_user_id;
        END IF;
      END IF;
    END LOOP;

    v_subtotal := ROUND(v_subtotal, 2);
    v_igv := ROUND(v_subtotal * 0.18, 2);

    UPDATE public.ventas
    SET
      subtotal = v_subtotal,
      igv = v_igv,
      total = v_subtotal + v_igv,
      updated_at = now()
    WHERE id = v_venta_id AND user_id = p_user_id;

  END LOOP;

  FOR v_header IN
    SELECT DISTINCT cliente_ruc
    FROM public.venta_legacy_import_items
    WHERE cliente_ruc IS NOT NULL AND btrim(cliente_ruc) <> ''
  LOOP
    SELECT string_agg(DISTINCT label, ', ' ORDER BY label)
    INTO v_modelos
    FROM (
      SELECT DISTINCT COALESCE(NULLIF(btrim(vli.codigo), ''), left(vli.descripcion, 80)) AS label
      FROM public.venta_legacy_import_items vli
      WHERE vli.cliente_ruc = v_header.cliente_ruc
      LIMIT 8
    ) t;

    IF v_modelos IS NOT NULL AND v_modelos <> '' THEN
      UPDATE public.clientes c
      SET modelos_interes = v_modelos,
          updated_at = now()
      WHERE c.user_id = p_user_id
        AND c.ruc = v_header.cliente_ruc
        AND (c.modelos_interes IS NULL OR btrim(c.modelos_interes) = '');
    END IF;
  END LOOP;

  RETURN (
    SELECT COUNT(DISTINCT codigo_comprobante)::INTEGER
    FROM public.venta_legacy_import_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_venta_items_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_venta_items_legacy_for_user(UUID) TO authenticated;
