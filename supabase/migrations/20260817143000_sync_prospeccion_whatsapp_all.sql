-- Incluir todas las conversaciones WhatsApp en Prospección (sin filtrar por etapa del inbox)

CREATE OR REPLACE FUNCTION public.sync_prospeccion_whatsapp_for_user(p_user_id UUID)
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

  IF to_regclass('public.inbox_conversations') IS NULL
     OR to_regclass('public.oportunidades') IS NULL THEN
    RETURN 0;
  END IF;

  WITH wa_leads AS (
    SELECT
      c.user_id,
      'WA-' || LEFT(regexp_replace(COALESCE(c.contact_identifier, c.external_id), '\D', '', 'g'), 20) AS codigo,
      COALESCE(NULLIF(btrim(c.contact_name), ''), 'Contacto WhatsApp') AS cliente_nombre,
      COALESCE(c.contact_identifier, '') AS telefono,
      LEFT(COALESCE(NULLIF(btrim(c.last_message), ''), 'Conversación WhatsApp'), 160) AS subtitulo,
      COALESCE(c.last_message_at, c.created_at, now()) AS fecha_oportunidad,
      COALESCE(
        NULLIF(btrim(c.metadata->>'source_phone_label'), ''),
        NULLIF(btrim(conn.display_name), ''),
        'WhatsApp'
      ) AS responsable_nombre
    FROM public.inbox_conversations c
    LEFT JOIN public.inbox_channel_connections conn ON conn.id = c.connection_id
    WHERE c.user_id = p_user_id
      AND c.channel = 'whatsapp'
      AND regexp_replace(COALESCE(c.contact_identifier, c.external_id), '\D', '', 'g') <> ''
  ),
  dedup AS (
    SELECT DISTINCT ON (codigo)
      user_id,
      codigo,
      cliente_nombre,
      telefono,
      subtitulo,
      fecha_oportunidad,
      responsable_nombre
    FROM wa_leads
    WHERE codigo <> 'WA-'
    ORDER BY codigo, fecha_oportunidad DESC
  ),
  upserted AS (
    INSERT INTO public.oportunidades (
      user_id,
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
      fecha_oportunidad
    )
    SELECT
      d.user_id,
      d.codigo,
      d.cliente_nombre,
      NULLIF(d.telefono, ''),
      'Lead WhatsApp',
      d.subtitulo,
      0,
      'Prospectos',
      10,
      d.responsable_nombre,
      UPPER(LEFT(regexp_replace(d.responsable_nombre, '[^A-Za-zÁÉÍÓÚáéíóú]', '', 'g') || 'WA', 2)),
      d.fecha_oportunidad
    FROM dedup d
    ON CONFLICT (user_id, codigo) DO UPDATE
      SET
        cliente_nombre = EXCLUDED.cliente_nombre,
        cliente_ruc = COALESCE(EXCLUDED.cliente_ruc, public.oportunidades.cliente_ruc),
        subtitulo = EXCLUDED.subtitulo,
        fecha_oportunidad = GREATEST(public.oportunidades.fecha_oportunidad, EXCLUDED.fecha_oportunidad),
        updated_at = now()
      WHERE public.oportunidades.etapa = 'Prospectos'
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_count FROM upserted;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_prospeccion_whatsapp_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_prospeccion_whatsapp_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_prospeccion_whatsapp_for_user(UUID) TO service_role;
