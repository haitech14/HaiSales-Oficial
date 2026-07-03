-- WhatsApp multi-número: vincular conversaciones a una conexión (phone_number_id)

ALTER TABLE public.inbox_conversations
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.inbox_channel_connections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inbox_conversations_connection
  ON public.inbox_conversations (connection_id, last_message_at DESC NULLS LAST);

-- external_id compuesto "{phone_number_id}:{wa_id}" distingue el mismo contacto en distintos números
