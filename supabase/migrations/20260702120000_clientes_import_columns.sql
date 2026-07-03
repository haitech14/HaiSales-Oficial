-- Columnas adicionales para importación legacy de clientes

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_cliente TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observaciones TEXT;

UPDATE public.clientes
SET correo = email
WHERE correo IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clientes_user_ruc_unique_idx
  ON public.clientes (user_id, ruc);

CREATE TABLE IF NOT EXISTS public.clientes_legacy_import (
  razon_social TEXT NOT NULL,
  ruc TEXT NOT NULL PRIMARY KEY,
  correo TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  tipo_cliente TEXT NOT NULL DEFAULT 'Público',
  estado TEXT NOT NULL DEFAULT 'prospecto',
  observaciones TEXT,
  segmento TEXT NOT NULL DEFAULT 'Otros'
);

ALTER TABLE public.clientes_legacy_import ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read clientes legacy import" ON public.clientes_legacy_import;
CREATE POLICY "Authenticated can read clientes legacy import" ON public.clientes_legacy_import
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.import_clientes_legacy_for_user(p_user_id UUID)
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

  INSERT INTO public.clientes (
    user_id,
    razon_social,
    ruc,
    correo,
    email,
    telefono,
    direccion,
    ciudad,
    tipo_cliente,
    estado_comercial,
    observaciones,
    notas,
    segmento,
    fecha_alta,
    activo
  )
  SELECT
    p_user_id,
    src.razon_social,
    src.ruc,
    src.correo,
    src.correo,
    src.telefono,
    src.direccion,
    src.ciudad,
    src.tipo_cliente,
    src.estado,
    src.observaciones,
    src.observaciones,
    src.segmento,
    CURRENT_DATE,
    true
  FROM public.clientes_legacy_import src
  ON CONFLICT (user_id, ruc)
  DO UPDATE SET
    razon_social = EXCLUDED.razon_social,
    correo = EXCLUDED.correo,
    email = EXCLUDED.email,
    telefono = EXCLUDED.telefono,
    direccion = EXCLUDED.direccion,
    ciudad = EXCLUDED.ciudad,
    tipo_cliente = EXCLUDED.tipo_cliente,
    estado_comercial = EXCLUDED.estado_comercial,
    observaciones = EXCLUDED.observaciones,
    notas = EXCLUDED.notas,
    segmento = EXCLUDED.segmento,
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_clientes_legacy_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_clientes_legacy_for_user(UUID) TO authenticated;
