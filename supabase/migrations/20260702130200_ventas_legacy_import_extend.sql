-- Sincronización completa desde ventas_legacy_import (ventas, ítems, tesorería, CxC)

CREATE OR REPLACE FUNCTION public.import_ventas_legacy_for_user(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_row RECORD;
  v_venta_id UUID;
  v_cuenta_id UUID;
  v_saldo NUMERIC(14, 2);
  v_cuenta_nombre TEXT;
  v_cuenta_tipo TEXT;
  v_cuenta_banco TEXT;
  v_cuenta_moneda TEXT;
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

  INSERT INTO public.venta_items (venta_id, descripcion, cantidad, precio_unitario, subtotal)
  SELECT
    v.id,
    src.tipo_comprobante || ' · ' || src.cliente_nombre,
    1,
    GREATEST(src.subtotal, 0),
    GREATEST(src.subtotal, 0)
  FROM public.ventas v
  JOIN public.ventas_legacy_import src ON src.codigo_comprobante = v.codigo_comprobante
  WHERE v.user_id = p_user_id
    AND NOT EXISTS (SELECT 1 FROM public.venta_items vi WHERE vi.venta_id = v.id);

  FOR v_row IN
    SELECT DISTINCT btrim(cuenta_cobro) AS cuenta
    FROM public.ventas_legacy_import
    WHERE cuenta_cobro IS NOT NULL
      AND btrim(cuenta_cobro) <> ''
      AND btrim(cuenta_cobro) <> '-'
      AND upper(btrim(cuenta_cobro)) <> 'CREDITO'
  LOOP
    v_cuenta_nombre := v_row.cuenta;
    v_cuenta_tipo := 'caja';
    v_cuenta_banco := NULL;
    v_cuenta_moneda := 'PEN';

    IF v_cuenta_nombre ILIKE '%DOLAR%' THEN
      v_cuenta_moneda := 'USD';
    END IF;

    IF v_cuenta_nombre ILIKE '%BCP%' OR v_cuenta_nombre ILIKE '%BBVA%'
       OR v_cuenta_nombre ILIKE '%INTERBANK%' OR v_cuenta_nombre ILIKE '%SCOTIA%' THEN
      v_cuenta_tipo := 'banco';
      IF v_cuenta_nombre ILIKE '%BCP%' THEN v_cuenta_banco := 'BCP'; END IF;
      IF v_cuenta_nombre ILIKE '%BBVA%' THEN v_cuenta_banco := 'BBVA'; END IF;
      IF v_cuenta_nombre ILIKE '%INTERBANK%' THEN v_cuenta_banco := 'Interbank'; END IF;
      IF v_cuenta_nombre ILIKE '%SCOTIA%' THEN v_cuenta_banco := 'Scotiabank'; END IF;
    END IF;

    INSERT INTO public.cuentas_tesoreria (user_id, nombre, tipo, banco, moneda, saldo_actual, activo)
    VALUES (p_user_id, v_cuenta_nombre, v_cuenta_tipo, v_cuenta_banco, v_cuenta_moneda, 0, true)
    ON CONFLICT (user_id, nombre) DO NOTHING;
  END LOOP;

  FOR v_row IN
    SELECT
      src.*,
      v.id AS venta_id
    FROM public.ventas_legacy_import src
    JOIN public.ventas v
      ON v.user_id = p_user_id
     AND v.codigo_comprobante = src.codigo_comprobante
    WHERE src.estado = 'confirmada'
      AND src.total > 0
    ORDER BY src.fecha, src.hora_emision NULLS LAST, src.codigo_comprobante
  LOOP
    IF upper(COALESCE(v_row.cuenta_cobro, '')) = 'CREDITO'
       OR upper(COALESCE(v_row.forma_pago, '')) = 'CREDITO' THEN
      INSERT INTO public.cuentas_cobrar (
        user_id, venta_id, documento, fecha_emision, fecha_vencimiento,
        monto, saldo_pendiente, estado, notas
      )
      VALUES (
        p_user_id,
        v_row.venta_id,
        v_row.codigo_comprobante,
        v_row.fecha,
        COALESCE(v_row.fecha_vencimiento, v_row.fecha + INTERVAL '30 days'),
        v_row.total,
        v_row.total,
        'pendiente',
        'Importado legacy · ' || v_row.cliente_nombre
      )
      ON CONFLICT (user_id, documento) DO NOTHING;
      CONTINUE;
    END IF;

    IF v_row.cuenta_cobro IS NULL OR btrim(v_row.cuenta_cobro) = '' OR btrim(v_row.cuenta_cobro) = '-' THEN
      CONTINUE;
    END IF;

    SELECT id, saldo_actual
    INTO v_cuenta_id, v_saldo
    FROM public.cuentas_tesoreria
    WHERE user_id = p_user_id
      AND nombre = btrim(v_row.cuenta_cobro)
    LIMIT 1;

    IF v_cuenta_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.movimientos_tesoreria m
      WHERE m.user_id = p_user_id
        AND m.cuenta_id = v_cuenta_id
        AND m.documento = v_row.codigo_comprobante
    ) THEN
      CONTINUE;
    END IF;

    v_saldo := v_saldo + v_row.total;

    INSERT INTO public.movimientos_tesoreria (
      user_id, cuenta_id, tipo, documento, concepto,
      monto_ingreso, monto_egreso, saldo_posterior, estado,
      responsable_nombre, responsable_iniciales, fecha, hora
    )
    VALUES (
      p_user_id,
      v_cuenta_id,
      'ingreso',
      v_row.codigo_comprobante,
      'Cobro ' || v_row.tipo_comprobante || ' · ' || v_row.cliente_nombre,
      v_row.total,
      NULL,
      v_saldo,
      'conciliado',
      COALESCE(NULLIF(v_row.vendedor_nombre, ''), 'Sin asignar'),
      UPPER(LEFT(REGEXP_REPLACE(COALESCE(NULLIF(v_row.vendedor_nombre, ''), 'SA'), '[^A-Za-z ]', '', 'g'), 2)),
      v_row.fecha,
      COALESCE(v_row.hora_emision, TIME '12:00:00')
    );

    UPDATE public.cuentas_tesoreria
    SET saldo_actual = v_saldo, updated_at = now()
    WHERE id = v_cuenta_id;
  END LOOP;

  RETURN v_count;
END;
$$;
