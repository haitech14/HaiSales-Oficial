-- Nota: en producción inbox_channel_connections.channel es TEXT.
-- Este archivo queda como no-op si el enum no existe.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'inbox_channel'
  ) THEN
    ALTER TYPE public.inbox_channel ADD VALUE IF NOT EXISTS 'zavu';
  END IF;
END $$;
