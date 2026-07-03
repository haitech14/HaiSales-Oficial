-- Prospección automática: clientes sin compra en 7 días o sin historial de compras

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

  -- Quitar prospección automática si el cliente compró en los últimos 7 días
  DELETE FROM public.oportunidades o
  WHERE o.user_id = p_user_id
    AND o.codigo LIKE 'PROSP-%'
    AND o.etapa = 'Prospectos'
    AND o.cliente_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.ventas v
      JOIN public.clientes c ON c.id = o.cliente_id
      WHERE v.user_id = p_user_id
        AND v.estado IS DISTINCT FROM 'anulada'
        AND v.fecha >= (CURRENT_DATE - INTERVAL '7 days')
        AND (
          v.cliente_id = c.id
          OR (
            c.ruc IS NOT NULL
            AND btrim(c.ruc) <> ''
            AND btrim(c.ruc) NOT IN ('—', '00000000')
            AND v.cliente_ruc = c.ruc
          )
        )
    );

  WITH ultima_compra_cliente AS (
    SELECT
      c.id AS cliente_id,
      MAX(v.fecha) AS ultima_compra
    FROM public.clientes c
    LEFT JOIN public.ventas v
      ON v.user_id = p_user_id
     AND v.estado IS DISTINCT FROM 'anulada'
     AND (
       v.cliente_id = c.id
       OR (
         c.ruc IS NOT NULL
         AND btrim(c.ruc) <> ''
         AND btrim(c.ruc) NOT IN ('—', '00000000')
         AND v.cliente_ruc = c.ruc
       )
     )
    WHERE c.user_id = p_user_id
      AND c.activo = true
    GROUP BY c.id
  ),
  clientes_para_prospeccion AS (
    SELECT
      c.id,
      c.user_id,
      c.razon_social,
      c.ruc,
      c.tipo_cliente,
      uc.ultima_compra,
      COALESCE(NULLIF(btrim(c.ejecutivo_nombre), ''), 'Sin asignar') AS responsable_nombre,
      COALESCE(
        NULLIF(btrim(c.ejecutivo_iniciales), ''),
        UPPER(LEFT(COALESCE(NULLIF(btrim(c.ejecutivo_nombre), ''), 'SA'), 2))
      ) AS responsable_iniciales
    FROM public.clientes c
    JOIN ultima_compra_cliente uc ON uc.cliente_id = c.id
    WHERE c.user_id = p_user_id
      AND c.activo = true
      AND (
        uc.ultima_compra IS NULL
        OR uc.ultima_compra < (CURRENT_DATE - INTERVAL '7 days')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.oportunidades o
        WHERE o.user_id = p_user_id
          AND o.cliente_id = c.id
          AND o.etapa IN ('Calificación', 'Propuesta', 'Negociación')
      )
  ),
  upserted AS (
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
      cp.user_id,
      cp.id,
      'PROSP-' || UPPER(SUBSTRING(REPLACE(cp.id::text, '-', '') FROM 1 FOR 8)),
      cp.razon_social,
      cp.ruc,
      'Seguimiento comercial',
      CASE
        WHEN cp.ultima_compra IS NULL THEN
          'Sin compras registradas · ' || COALESCE(cp.tipo_cliente, 'Público') || ' · Agendar contacto'
        ELSE
          'Sin compra en 7+ días · Última: ' || to_char(cp.ultima_compra, 'DD/MM/YYYY')
          || ' · ' || COALESCE(cp.tipo_cliente, 'Público')
      END,
      0,
      'Prospectos',
      15,
      cp.responsable_nombre,
      cp.responsable_iniciales,
      now(),
      (CURRENT_DATE + INTERVAL '7 days')::date
    FROM clientes_para_prospeccion cp
    ON CONFLICT (user_id, codigo) DO UPDATE SET
      cliente_nombre = EXCLUDED.cliente_nombre,
      cliente_ruc = EXCLUDED.cliente_ruc,
      titulo = EXCLUDED.titulo,
      subtitulo = EXCLUDED.subtitulo,
      etapa = 'Prospectos',
      responsable_nombre = EXCLUDED.responsable_nombre,
      responsable_iniciales = EXCLUDED.responsable_iniciales,
      fecha_oportunidad = now(),
      fecha_cierre_estimada = EXCLUDED.fecha_cierre_estimada,
      updated_at = now()
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
    u.user_id,
    u.id,
    'llamada',
    'pendiente',
    'Seguimiento de prospección · ' || u.cliente_nombre,
    now() + INTERVAL '2 days',
    'Cliente sin compra reciente. Coordinar promoción o cierre de venta.'
  FROM upserted u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.actividades_comerciales a
    WHERE a.user_id = u.user_id
      AND a.oportunidad_id = u.id
      AND a.estado = 'pendiente'
  );

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
