-- Inbox multicanal: conversaciones y conexiones de API

DO $$ BEGIN
  CREATE TYPE public.inbox_channel AS ENUM (
    'whatsapp', 'facebook', 'messenger', 'tiktok', 'web', 'email'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inbox_stage AS ENUM (
    'nuevo', 'seguimiento', 'cotizado', 'cerrado', 'perdido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inbox_priority AS ENUM ('alta', 'media', 'baja');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inbox_status AS ENUM ('activa', 'cerrada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.inbox_channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel public.inbox_channel NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.inbox_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel public.inbox_channel NOT NULL,
  external_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_identifier TEXT NOT NULL,
  contact_avatar_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  stage public.inbox_stage NOT NULL DEFAULT 'nuevo',
  priority public.inbox_priority NOT NULL DEFAULT 'media',
  status public.inbox_status NOT NULL DEFAULT 'activa',
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
  ON public.inbox_conversations (user_id, channel, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation
  ON public.inbox_messages (conversation_id, sent_at DESC);

ALTER TABLE public.inbox_channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own inbox connections" ON public.inbox_channel_connections;
CREATE POLICY "Users manage own inbox connections" ON public.inbox_channel_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own inbox conversations" ON public.inbox_conversations;
CREATE POLICY "Users manage own inbox conversations" ON public.inbox_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own inbox messages" ON public.inbox_messages;
CREATE POLICY "Users manage own inbox messages" ON public.inbox_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_inbox_channel_connections_updated_at ON public.inbox_channel_connections;
CREATE TRIGGER update_inbox_channel_connections_updated_at
  BEFORE UPDATE ON public.inbox_channel_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inbox_conversations_updated_at ON public.inbox_conversations;
CREATE TRIGGER update_inbox_conversations_updated_at
  BEFORE UPDATE ON public.inbox_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
