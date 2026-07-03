-- Agenda en Pipeline (etapa Prospectos / Prospección) a clientes sin compras registradas

CREATE OR REPLACE FUNCTION public.sync_prospeccion_sin_compra_for_user(p_user_id UUID)
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

  WITH clientes_sin_compra AS (
    SELECT
      c.id,
      c.user_id,
      c.razon_social,
      c.ruc,
      c.tipo_cliente,
      COALESCE(NULLIF(TRIM(c.ejecutivo_nombre), ''), 'Sin asignar') AS responsable_nombre,
      COALESCE(
        NULLIF(TRIM(c.ejecutivo_iniciales), ''),
        UPPER(LEFT(COALESCE(NULLIF(TRIM(c.ejecutivo_nombre), ''), 'SA'), 2))
      ) AS responsable_iniciales
    FROM public.clientes c
    WHERE c.user_id = p_user_id
      AND c.activo = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.ventas v
        WHERE v.user_id = p_user_id
          AND v.estado IS DISTINCT FROM 'anulada'
          AND (
            v.cliente_id = c.id
            OR (
              c.ruc IS NOT NULL
              AND TRIM(c.ruc) <> ''
              AND TRIM(c.ruc) NOT IN ('—', '00000000')
              AND v.cliente_ruc = c.ruc
            )
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.oportunidades o
        WHERE o.user_id = p_user_id
          AND o.cliente_id = c.id
      )
  ),
  nuevas AS (
    INSERT INTO public.oportunidades (
      user_id,
      cliente_id,
      codigo,
      cliente_nombre,
      cliente_ruc,
      titulo,
      subtitulo,
      valor,
      etapa,
      probabilidad,
      responsable_nombre,
      responsable_iniciales,
      fecha_oportunidad,
      fecha_cierre_estimada
    )
    SELECT
      cs.user_id,
      cs.id,
      'PROSP-' || UPPER(SUBSTRING(REPLACE(cs.id::text, '-', '') FROM 1 FOR 8)),
      cs.razon_social,
      cs.ruc,
      'Contactar y agendar promoción',
      'Sin última compra · ' || COALESCE(cs.tipo_cliente, 'Público') || ' · Cerrar primera venta',
      0,
      'Prospectos',
      15,
      cs.responsable_nombre,
      cs.responsable_iniciales,
      now(),
      (CURRENT_DATE + INTERVAL '14 days')::date
    FROM clientes_sin_compra cs
    ON CONFLICT (user_id, codigo) DO NOTHING
    RETURNING id, user_id, cliente_nombre
  )
  INSERT INTO public.actividades_comerciales (
    user_id,
    oportunidad_id,
    tipo,
    estado,
    titulo,
    fecha_programada,
    notas
  )
  SELECT
    n.user_id,
    n.id,
    'llamada',
    'pendiente',
    'Llamada de prospección · ' || n.cliente_nombre,
    now() + INTERVAL '3 days',
    'Cliente sin compras registradas. Coordinar promoción o cierre de venta.'
  FROM nuevas n;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.oportunidades o
  WHERE o.user_id = p_user_id
    AND o.etapa = 'Prospectos'
    AND o.codigo LIKE 'PROSP-%';

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_prospeccion_sin_compra_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_prospeccion_sin_compra_for_user(UUID) TO authenticated;
