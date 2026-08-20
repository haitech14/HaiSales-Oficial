-- Sincronización bidireccional HaiSales ↔ HaiStore (haitech.pe) / Soporte Haitech

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS external_updated_at TIMESTAMPTZ;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS external_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.haitech_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('pull', 'push')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('cliente', 'producto', 'batch')),
  entity_id UUID,
  source_system TEXT,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'skipped')),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS haitech_sync_log_user_created_idx
  ON public.haitech_sync_log (user_id, created_at DESC);

ALTER TABLE public.haitech_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own haitech sync log" ON public.haitech_sync_log;
CREATE POLICY "Users read own haitech sync log" ON public.haitech_sync_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON public.haitech_sync_log TO authenticated;
GRANT ALL ON public.haitech_sync_log TO service_role;

-- Upsert clientes desde HaiStore/Soporte sin re-disparar sync outbound
CREATE OR REPLACE FUNCTION public.upsert_cliente_from_haitech(p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_user_id UUID := (p_payload->>'user_id')::uuid;
  v_source_system TEXT := NULLIF(p_payload->>'source_system', '');
  v_source_id TEXT := NULLIF(p_payload->>'source_id', '');
  v_ruc TEXT := NULLIF(p_payload->>'ruc', '');
BEGIN
  PERFORM set_config('haitech.syncing', 'true', true);

  IF v_source_system IS NOT NULL AND v_source_id IS NOT NULL THEN
    SELECT c.id INTO v_id
    FROM public.clientes c
    WHERE c.user_id = v_user_id
      AND c.source_system = v_source_system
      AND c.source_id = v_source_id
    LIMIT 1;
  END IF;

  IF v_id IS NULL AND v_ruc IS NOT NULL THEN
    SELECT c.id INTO v_id
    FROM public.clientes c
    WHERE c.user_id = v_user_id AND c.ruc = v_ruc
    LIMIT 1;
  END IF;

  IF v_id IS NOT NULL THEN
    UPDATE public.clientes c
    SET
      razon_social = COALESCE(p_payload->>'razon_social', c.razon_social),
      ruc = COALESCE(v_ruc, c.ruc),
      correo = COALESCE(NULLIF(p_payload->>'correo', ''), c.correo),
      email = COALESCE(NULLIF(p_payload->>'correo', ''), c.email),
      telefono = COALESCE(NULLIF(p_payload->>'telefono', ''), c.telefono),
      direccion = COALESCE(NULLIF(p_payload->>'direccion', ''), c.direccion),
      ciudad = COALESCE(NULLIF(p_payload->>'ciudad', ''), c.ciudad),
      distrito = COALESCE(NULLIF(p_payload->>'distrito', ''), c.distrito),
      tipo_cliente = COALESCE(NULLIF(p_payload->>'tipo_cliente', ''), c.tipo_cliente),
      contacto_nombre = COALESCE(NULLIF(p_payload->>'contacto_nombre', ''), c.contacto_nombre),
      notas = COALESCE(NULLIF(p_payload->>'notas', ''), c.notas),
      observaciones = COALESCE(NULLIF(p_payload->>'observaciones', ''), c.observaciones),
      segmento = COALESCE(p_payload->>'segmento', c.segmento),
      estado_comercial = COALESCE(p_payload->>'estado_comercial', c.estado_comercial),
      produccion_mensual = COALESCE(NULLIF(p_payload->>'produccion_mensual', ''), c.produccion_mensual),
      source_system = COALESCE(v_source_system, c.source_system),
      source_id = COALESCE(v_source_id, c.source_id),
      external_updated_at = COALESCE(NULLIF(p_payload->>'external_updated_at', '')::timestamptz, c.external_updated_at),
      last_synced_at = now(),
      updated_at = now()
    WHERE c.id = v_id;
  ELSE
    INSERT INTO public.clientes (
      user_id, razon_social, ruc, correo, email, telefono, direccion, ciudad, distrito,
      tipo_cliente, contacto_nombre, notas, observaciones, segmento, estado_comercial,
      produccion_mensual, fecha_alta, source_system, source_id, external_updated_at,
      last_synced_at, activo
    )
    VALUES (
      v_user_id,
      COALESCE(p_payload->>'razon_social', 'Sin nombre'),
      v_ruc,
      NULLIF(p_payload->>'correo', ''),
      NULLIF(p_payload->>'correo', ''),
      NULLIF(p_payload->>'telefono', ''),
      NULLIF(p_payload->>'direccion', ''),
      NULLIF(p_payload->>'ciudad', ''),
      NULLIF(p_payload->>'distrito', ''),
      NULLIF(p_payload->>'tipo_cliente', ''),
      NULLIF(p_payload->>'contacto_nombre', ''),
      NULLIF(p_payload->>'notas', ''),
      NULLIF(p_payload->>'observaciones', ''),
      COALESCE(p_payload->>'segmento', 'Otros'),
      COALESCE(p_payload->>'estado_comercial', 'activo'),
      NULLIF(p_payload->>'produccion_mensual', ''),
      COALESCE((p_payload->>'fecha_alta')::date, CURRENT_DATE),
      v_source_system,
      v_source_id,
      NULLIF(p_payload->>'external_updated_at', '')::timestamptz,
      now(),
      COALESCE((p_payload->>'activo')::boolean, true)
    )
    RETURNING id INTO v_id;
  END IF;

  PERFORM set_config('haitech.syncing', 'false', true);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_producto_from_haitech(p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  PERFORM set_config('haitech.syncing', 'true', true);

  INSERT INTO public.productos (
    user_id,
    sku,
    nombre,
    descripcion,
    precio,
    stock,
    unidad,
    marca,
    categoria,
    tipo,
    moneda,
    source_system,
    source_id,
    external_updated_at,
    last_synced_at,
    activo
  )
  VALUES (
    (p_payload->>'user_id')::uuid,
    NULLIF(p_payload->>'sku', ''),
    COALESCE(p_payload->>'nombre', 'Producto'),
    NULLIF(p_payload->>'descripcion', ''),
    COALESCE((p_payload->>'precio')::numeric, 0),
    COALESCE((p_payload->>'stock')::integer, 0),
    COALESCE(p_payload->>'unidad', 'und'),
    NULLIF(p_payload->>'marca', ''),
    NULLIF(p_payload->>'categoria', ''),
    COALESCE(p_payload->>'tipo', 'producto'),
    COALESCE(p_payload->>'moneda', 'PEN'),
    NULLIF(p_payload->>'source_system', ''),
    NULLIF(p_payload->>'source_id', ''),
    NULLIF(p_payload->>'external_updated_at', '')::timestamptz,
    now(),
    COALESCE((p_payload->>'activo')::boolean, true)
  )
  ON CONFLICT (user_id, source_system, source_id)
    WHERE source_system IS NOT NULL AND source_id IS NOT NULL
  DO UPDATE SET
    sku = COALESCE(EXCLUDED.sku, productos.sku),
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    precio = EXCLUDED.precio,
    stock = EXCLUDED.stock,
    unidad = EXCLUDED.unidad,
    marca = EXCLUDED.marca,
    categoria = EXCLUDED.categoria,
    tipo = EXCLUDED.tipo,
    moneda = EXCLUDED.moneda,
    external_updated_at = EXCLUDED.external_updated_at,
    last_synced_at = now(),
    updated_at = now()
  RETURNING id INTO v_id;

  PERFORM set_config('haitech.syncing', 'false', true);
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_cliente_from_haitech(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_producto_from_haitech(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_cliente_from_haitech(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_producto_from_haitech(JSONB) TO service_role;
