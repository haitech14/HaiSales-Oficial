-- Asegura tablas del inbox multicanal (conversaciones + mensajes)
-- channel/stage/priority/status como TEXT para alinear con inbox_channel_connections

CREATE TABLE IF NOT EXISTS public.inbox_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  connection_id UUID REFERENCES public.inbox_channel_connections(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_identifier TEXT NOT NULL,
  contact_avatar_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  stage TEXT NOT NULL DEFAULT 'nuevo',
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'activa',
  advisor_name TEXT,
  advisor_initials TEXT,
  campaign TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, external_id)
);

CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.inbox_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_conversations_user_channel
  ON public.inbox_conversations (user_id, channel, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_inbox_conversations_connection
  ON public.inbox_conversations (connection_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation
  ON public.inbox_messages (conversation_id, sent_at DESC);

ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own inbox conversations" ON public.inbox_conversations;
CREATE POLICY "Users manage own inbox conversations" ON public.inbox_conversations
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own inbox messages" ON public.inbox_messages;
CREATE POLICY "Users manage own inbox messages" ON public.inbox_messages
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_inbox_conversations_updated_at ON public.inbox_conversations;
CREATE TRIGGER update_inbox_conversations_updated_at
  BEFORE UPDATE ON public.inbox_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_messages TO authenticated;
GRANT ALL ON public.inbox_conversations TO service_role;
GRANT ALL ON public.inbox_messages TO service_role;

-- RPC de limpieza: no falla si aún no existen tablas del inbox
CREATE OR REPLACE FUNCTION public.clear_demo_data_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF to_regclass('public.inbox_messages') IS NOT NULL
     AND to_regclass('public.inbox_conversations') IS NOT NULL THEN
    DELETE FROM public.inbox_messages
    WHERE user_id = p_user_id
      AND conversation_id IN (
        SELECT id FROM public.inbox_conversations
        WHERE user_id = p_user_id
          AND external_id IN (
            'wa-demo-001', 'fb-demo-002', 'em-demo-003',
            'wa-maria', 'ig-lucia', 'fb-roberto', 'wa-carmen',
            'web-4821', 'mail-norte', 'ig-ferre', 'wa-andina'
          )
      );

    DELETE FROM public.inbox_conversations
    WHERE user_id = p_user_id
      AND external_id IN (
        'wa-demo-001', 'fb-demo-002', 'em-demo-003',
        'wa-maria', 'ig-lucia', 'fb-roberto', 'wa-carmen',
        'web-4821', 'mail-norte', 'ig-ferre', 'wa-andina'
      );
  END IF;

  IF to_regclass('public.cuentas_cobrar') IS NOT NULL THEN
    DELETE FROM public.cuentas_cobrar
    WHERE user_id = p_user_id
      AND documento IN ('F001-00001248');
  END IF;

  IF to_regclass('public.ventas') IS NOT NULL THEN
    DELETE FROM public.ventas
    WHERE user_id = p_user_id
      AND numero IN ('F001-00001248', 'B001-00004521');
  END IF;

  IF to_regclass('public.asientos_contables') IS NOT NULL
     AND to_regclass('public.asiento_lineas') IS NOT NULL THEN
    DELETE FROM public.asiento_lineas
    WHERE asiento_id IN (
      SELECT id FROM public.asientos_contables
      WHERE user_id = p_user_id AND codigo = 'AS-000148'
    );

    DELETE FROM public.asientos_contables
    WHERE user_id = p_user_id AND codigo = 'AS-000148';
  END IF;

  IF to_regclass('public.cotizaciones') IS NOT NULL THEN
    DELETE FROM public.cotizaciones
    WHERE user_id = p_user_id AND codigo = 'COT-000087';
  END IF;

  IF to_regclass('public.oportunidades') IS NOT NULL THEN
    DELETE FROM public.oportunidades
    WHERE user_id = p_user_id
      AND codigo IN ('OP-000119', 'OP-000120', 'OP-000121', 'OP-000122', 'OP-000123');
  END IF;

  IF to_regclass('public.actividades_comerciales') IS NOT NULL THEN
    DELETE FROM public.actividades_comerciales
    WHERE user_id = p_user_id
      AND titulo IN (
        'Llamadas por realizar',
        'Reuniones agendadas',
        'Correos por enviar',
        'Seguimientos pendientes'
      );
  END IF;

  IF to_regclass('public.plan_cuentas') IS NOT NULL THEN
    DELETE FROM public.plan_cuentas
    WHERE user_id = p_user_id
      AND codigo IN ('1211', '4011', '7011', '6311');
  END IF;

  IF to_regclass('public.clientes') IS NOT NULL THEN
    DELETE FROM public.clientes
    WHERE user_id = p_user_id
      AND ruc IN (
        '20123456789',
        '20567891234',
        '20456789123',
        '20678912345',
        '20345678912',
        '20198765432',
        '20765432198',
        '20432198765',
        '20543219876',
        '20654321987'
      );
  END IF;

  IF to_regclass('public.almacenes') IS NOT NULL THEN
    DELETE FROM public.almacenes
    WHERE user_id = p_user_id
      AND nombre IN ('Almacén Central', 'Almacén Norte', 'Almacén Sur');
  END IF;

  IF to_regclass('public.movimientos_tesoreria') IS NOT NULL THEN
    DELETE FROM public.movimientos_tesoreria
    WHERE user_id = p_user_id
      AND documento = 'INI-0001';
  END IF;

  IF to_regclass('public.cuentas_tesoreria') IS NOT NULL THEN
    DELETE FROM public.cuentas_tesoreria
    WHERE user_id = p_user_id
      AND nombre IN ('BCP Soles', 'BBVA Soles', 'Caja Chica');
  END IF;

  IF to_regclass('public.ordenes_compra') IS NOT NULL
     AND to_regclass('public.orden_compra_items') IS NOT NULL THEN
    DELETE FROM public.orden_compra_items
    WHERE orden_id IN (
      SELECT id FROM public.ordenes_compra
      WHERE user_id = p_user_id
        AND (numero LIKE 'OC-2026-%' OR notas LIKE 'Orden demo importada%')
    );

    DELETE FROM public.ordenes_compra
    WHERE user_id = p_user_id
      AND (numero LIKE 'OC-2026-%' OR notas LIKE 'Orden demo importada%');
  END IF;

  IF to_regclass('public.productos') IS NOT NULL THEN
    DELETE FROM public.productos
    WHERE user_id = p_user_id
      AND sku IN (
        'PROD-000123', 'PROD-000124', 'PROD-000125', 'PROD-000126', 'PROD-000127',
        'PROD-000128', 'PROD-000129', 'PROD-000130', 'SERV-000045', 'KIT-000012'
      );
  END IF;

  IF to_regclass('public.trabajadores') IS NOT NULL THEN
    DELETE FROM public.trabajadores
    WHERE user_id = p_user_id
      AND (
        codigo IN (
          'TR-0001', 'TR-0002', 'TR-0003', 'TR-0004', 'TR-0005',
          'TR-0006', 'TR-0007', 'TR-0008', 'TR-0009', 'TR-0010'
        )
        OR dni IN (
          '45123678', '40789456', '72349851', '09876543', '55432198',
          '41234567', '67890123', '33445566', '77889900', '22334455'
        )
      );
  END IF;

  IF to_regclass('public.empresa_config') IS NOT NULL THEN
    UPDATE public.empresa_config
    SET demo_cleanup_dismissed = true
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_demo_data_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_demo_data_for_user(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
