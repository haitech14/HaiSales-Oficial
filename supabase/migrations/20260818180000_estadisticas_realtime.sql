-- Replica identity so Realtime filters on user_id work for UPDATE/DELETE.
ALTER TABLE public.ventas REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_compra'
  ) THEN
    EXECUTE 'ALTER TABLE public.ordenes_compra REPLICA IDENTITY FULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ventas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ventas;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_compra'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ordenes_compra'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ordenes_compra;
  END IF;
END $$;
