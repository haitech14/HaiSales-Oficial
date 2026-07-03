-- Importación legacy de comprobantes (reportes Sep–Dic 2024)

CREATE TABLE IF NOT EXISTS public.ventas_legacy_import (
  codigo_comprobante TEXT PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_emision TIME,
  tipo_comprobante TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero_correlativo INTEGER NOT NULL,
  cliente_ruc TEXT,
  cliente_nombre TEXT NOT NULL,
  vendedor_nombre TEXT,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  moneda_origen TEXT NOT NULL DEFAULT 'PEN',
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  igv NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tipo_cambio NUMERIC(10, 4),
  forma_pago TEXT,
  cuenta_cobro TEXT,
  periodo_mes TEXT NOT NULL,
  fuente_archivo TEXT NOT NULL,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'confirmada',
  estado_sunat TEXT NOT NULL DEFAULT 'aceptado',
  tiene_cdr BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.ventas_legacy_import ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read ventas legacy import" ON public.ventas_legacy_import;
CREATE POLICY "Authenticated can read ventas legacy import" ON public.ventas_legacy_import
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.import_ventas_legacy_for_user(p_user_id UUID)
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

  INSERT INTO public.ventas (
    user_id,
    cliente_id,
    numero,
    fecha,
    hora_emision,
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
  SELECT
    p_user_id,
    c.id,
    src.numero,
    src.fecha,
    src.hora_emision,
    src.estado,
    src.moneda,
    src.subtotal,
    src.igv,
    src.total,
    src.notas,
    src.tipo_comprobante,
    src.codigo_comprobante,
    src.estado_sunat,
    COALESCE(NULLIF(src.vendedor_nombre, ''), 'Sin asignar'),
    UPPER(LEFT(REGEXP_REPLACE(COALESCE(NULLIF(src.vendedor_nombre, ''), 'SA'), '[^A-Za-z ]', '', 'g'), 2)),
    src.tiene_cdr,
    src.cliente_nombre,
    src.cliente_ruc
  FROM public.ventas_legacy_import src
  LEFT JOIN public.clientes c
    ON c.user_id = p_user_id
   AND src.cliente_ruc IS NOT NULL
   AND btrim(src.cliente_ruc) <> ''
   AND c.ruc = src.cliente_ruc
  ON CONFLICT (user_id, codigo_comprobante) WHERE codigo_comprobante IS NOT NULL
  DO UPDATE SET
    cliente_id = EXCLUDED.cliente_id,
    fecha = EXCLUDED.fecha,
    hora_emision = EXCLUDED.hora_emision,
    estado = EXCLUDED.estado,
    moneda = EXCLUDED.moneda,
    subtotal = EXCLUDED.subtotal,
    igv = EXCLUDED.igv,
    total = EXCLUDED.total,
    notas = EXCLUDED.notas,
    tipo_comprobante = EXCLUDED.tipo_comprobante,
    estado_sunat = EXCLUDED.estado_sunat,
    vendedor_nombre = EXCLUDED.vendedor_nombre,
    vendedor_iniciales = EXCLUDED.vendedor_iniciales,
    tiene_cdr = EXCLUDED.tiene_cdr,
    cliente_nombre = EXCLUDED.cliente_nombre,
    cliente_ruc = EXCLUDED.cliente_ruc,
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_ventas_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_ventas_legacy_for_user(UUID) TO authenticated;
