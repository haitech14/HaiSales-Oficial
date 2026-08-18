-- Replica identity so Realtime filters on user_id work for UPDATE/DELETE.
ALTER TABLE public.inbox_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.inbox_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inbox_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inbox_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_messages;
  END IF;
END $$;

DELETE FROM public.inbox_messages a
USING public.inbox_messages b
WHERE a.external_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.external_id = b.external_id
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS inbox_messages_user_external_uidx
  ON public.inbox_messages (user_id, external_id)
  WHERE external_id IS NOT NULL;
