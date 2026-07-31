-- Asegura tabla de conexiones (incluye canal zavu como TEXT)
CREATE TABLE IF NOT EXISTS public.inbox_channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  display_name TEXT,
  external_account_id TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  webhook_secret TEXT,
  access_token_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  error_message TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, external_account_id)
);

ALTER TABLE public.inbox_channel_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own inbox connections" ON public.inbox_channel_connections;
CREATE POLICY "Users manage own inbox connections" ON public.inbox_channel_connections
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_channel_connections TO authenticated;
GRANT ALL ON public.inbox_channel_connections TO service_role;
