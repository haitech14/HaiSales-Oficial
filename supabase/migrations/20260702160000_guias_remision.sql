-- Guías de remisión remitente + import legacy

CREATE TABLE IF NOT EXISTS public.guias_remision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_guia TEXT NOT NULL,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero_correlativo INTEGER NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_traslado DATE NOT NULL,
  motivo_traslado TEXT NOT NULL DEFAULT 'venta',
  sucursal TEXT,
  destinatario_ruc TEXT,
  destinatario_nombre TEXT NOT NULL,
  direccion_partida TEXT,
  direccion_destino TEXT,
  conductor_ruc TEXT,
  conductor_nombre TEXT,
  licencia TEXT,
  placa TEXT,
  peso_total NUMERIC(12, 2),
  bultos INTEGER,
  observacion TEXT,
  comprobante_relacionado TEXT,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida', 'en_transito', 'entregada', 'anulada')),
  estado_sunat TEXT NOT NULL DEFAULT 'aceptado',
  periodo_mes TEXT NOT NULL,
  fuente_archivo TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo_guia)
);

CREATE INDEX IF NOT EXISTS guias_remision_user_periodo_idx
  ON public.guias_remision (user_id, periodo_mes DESC);

CREATE INDEX IF NOT EXISTS guias_remision_user_fecha_idx
  ON public.guias_remision (user_id, fecha_emision DESC);

CREATE TABLE IF NOT EXISTS public.guia_remision_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guia_id UUID NOT NULL REFERENCES public.guias_remision(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'UND',
  peso_unitario NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guia_remision_items_guia_idx
  ON public.guia_remision_items (guia_id);

ALTER TABLE public.guias_remision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guia_remision_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own guias" ON public.guias_remision;
DROP POLICY IF EXISTS "Users can insert own guias" ON public.guias_remision;
DROP POLICY IF EXISTS "Users can update own guias" ON public.guias_remision;

CREATE POLICY "Users can select own guias" ON public.guias_remision
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own guias" ON public.guias_remision
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guias" ON public.guias_remision
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own guia items" ON public.guia_remision_items;
DROP POLICY IF EXISTS "Users can insert own guia items" ON public.guia_remision_items;

CREATE POLICY "Users can select own guia items" ON public.guia_remision_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own guia items" ON public.guia_remision_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staging legacy
CREATE TABLE IF NOT EXISTS public.guias_legacy_import (
  codigo_guia TEXT PRIMARY KEY,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero_correlativo INTEGER NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_traslado DATE NOT NULL,
  motivo_traslado TEXT NOT NULL,
  sucursal TEXT,
  destinatario_ruc TEXT,
  destinatario_nombre TEXT NOT NULL,
  direccion_partida TEXT,
  direccion_destino TEXT,
  conductor_ruc TEXT,
  conductor_nombre TEXT,
  licencia TEXT,
  placa TEXT,
  peso_total NUMERIC(12, 2),
  bultos INTEGER,
  observacion TEXT,
  comprobante_relacionado TEXT,
  estado TEXT NOT NULL DEFAULT 'emitida',
  estado_sunat TEXT NOT NULL DEFAULT 'aceptado',
  periodo_mes TEXT NOT NULL,
  fuente_archivo TEXT NOT NULL,
  notas TEXT
);

CREATE TABLE IF NOT EXISTS public.guia_legacy_import_items (
  id BIGSERIAL PRIMARY KEY,
  codigo_guia TEXT NOT NULL REFERENCES public.guias_legacy_import(codigo_guia) ON DELETE CASCADE,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'UND',
  peso_unitario NUMERIC(12, 2)
);

ALTER TABLE public.guias_legacy_import ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guia_legacy_import_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read guias legacy import" ON public.guias_legacy_import;
CREATE POLICY "Authenticated can read guias legacy import" ON public.guias_legacy_import
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can read guia legacy items" ON public.guia_legacy_import_items;
CREATE POLICY "Authenticated can read guia legacy items" ON public.guia_legacy_import_items
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.import_guias_legacy_for_user(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_guia RECORD;
  v_item RECORD;
  v_guia_id UUID;
  v_venta_id UUID;
  v_producto_id UUID;
  v_almacen TEXT;
  v_costo NUMERIC;
  v_stock NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_guia IN SELECT * FROM public.guias_legacy_import ORDER BY fecha_emision, codigo_guia LOOP
    v_venta_id := NULL;
    IF v_guia.comprobante_relacionado IS NOT NULL AND v_guia.comprobante_relacionado <> '' THEN
      SELECT v.id INTO v_venta_id
      FROM public.ventas v
      WHERE v.user_id = p_user_id
        AND v.codigo_comprobante = v_guia.comprobante_relacionado
      LIMIT 1;
    END IF;

    INSERT INTO public.guias_remision (
      user_id, codigo_guia, numero, serie, numero_correlativo,
      fecha_emision, fecha_traslado, motivo_traslado, sucursal,
      destinatario_ruc, destinatario_nombre, direccion_partida, direccion_destino,
      conductor_ruc, conductor_nombre, licencia, placa,
      peso_total, bultos, observacion, comprobante_relacionado, venta_id,
      estado, estado_sunat, periodo_mes, fuente_archivo, notas
    ) VALUES (
      p_user_id, v_guia.codigo_guia, v_guia.numero, v_guia.serie, v_guia.numero_correlativo,
      v_guia.fecha_emision, v_guia.fecha_traslado, v_guia.motivo_traslado, v_guia.sucursal,
      v_guia.destinatario_ruc, v_guia.destinatario_nombre, v_guia.direccion_partida, v_guia.direccion_destino,
      v_guia.conductor_ruc, v_guia.conductor_nombre, v_guia.licencia, v_guia.placa,
      v_guia.peso_total, v_guia.bultos, v_guia.observacion, v_guia.comprobante_relacionado, v_venta_id,
      v_guia.estado, v_guia.estado_sunat, v_guia.periodo_mes, v_guia.fuente_archivo, v_guia.notas
    )
    ON CONFLICT (user_id, codigo_guia) DO UPDATE SET
      fecha_emision = EXCLUDED.fecha_emision,
      fecha_traslado = EXCLUDED.fecha_traslado,
      motivo_traslado = EXCLUDED.motivo_traslado,
      destinatario_nombre = EXCLUDED.destinatario_nombre,
      comprobante_relacionado = EXCLUDED.comprobante_relacionado,
      venta_id = COALESCE(EXCLUDED.venta_id, public.guias_remision.venta_id),
      observacion = EXCLUDED.observacion,
      notas = EXCLUDED.notas,
      updated_at = now()
    RETURNING id INTO v_guia_id;

    DELETE FROM public.guia_remision_items
    WHERE guia_id = v_guia_id AND user_id = p_user_id;

    FOR v_item IN
      SELECT * FROM public.guia_legacy_import_items
      WHERE codigo_guia = v_guia.codigo_guia
    LOOP
      v_producto_id := NULL;
      v_almacen := COALESCE(v_guia.sucursal, 'Almacén Principal');
      v_costo := 0;
      v_stock := 0;

      IF v_item.codigo IS NOT NULL AND v_item.codigo <> '' THEN
        SELECT p.id, p.almacen, COALESCE(p.costo, 0), p.stock
        INTO v_producto_id, v_almacen, v_costo, v_stock
        FROM public.productos p
        WHERE p.user_id = p_user_id AND upper(p.sku) = upper(v_item.codigo)
        LIMIT 1;
      END IF;

      IF v_producto_id IS NULL THEN
        SELECT p.id, p.almacen, COALESCE(p.costo, 0), p.stock
        INTO v_producto_id, v_almacen, v_costo, v_stock
        FROM public.productos p
        WHERE p.user_id = p_user_id
          AND p.nombre ILIKE '%' || left(v_item.descripcion, 40) || '%'
        LIMIT 1;
      END IF;

      INSERT INTO public.guia_remision_items (
        guia_id, user_id, producto_id, codigo, descripcion, cantidad, unidad, peso_unitario
      ) VALUES (
        v_guia_id, p_user_id, v_producto_id, v_item.codigo, v_item.descripcion,
        v_item.cantidad, v_item.unidad, v_item.peso_unitario
      );

      IF v_producto_id IS NOT NULL AND v_guia.estado <> 'anulada' THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.kardex_movimientos km
          WHERE km.user_id = p_user_id
            AND km.producto_id = v_producto_id
            AND km.documento_referencia = v_guia.codigo_guia
        ) THEN
          INSERT INTO public.kardex_movimientos (
            user_id, producto_id, almacen_origen, tipo, cantidad, unidad,
            costo_unitario, costo_total, motivo, responsable,
            documento_referencia, estado, fecha_movimiento
          ) VALUES (
            p_user_id, v_producto_id, v_almacen, 'salida', v_item.cantidad, v_item.unidad,
            v_costo, v_item.cantidad * v_costo,
            'Guía de remisión ' || v_guia.codigo_guia || ' (' || v_guia.motivo_traslado || ')',
            COALESCE(v_guia.conductor_nombre, 'Logística'),
            v_guia.codigo_guia, 'completado', v_guia.fecha_traslado
          );

          UPDATE public.productos
          SET stock = GREATEST(0, v_stock - v_item.cantidad),
              ultimo_movimiento_at = now()
          WHERE id = v_producto_id AND user_id = p_user_id;
        END IF;
      END IF;
    END LOOP;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_guias_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_guias_legacy_for_user(UUID) TO authenticated;
