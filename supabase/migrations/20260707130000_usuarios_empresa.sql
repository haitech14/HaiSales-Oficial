-- Usuarios del equipo por cuenta (módulo Usuarios)

CREATE TABLE IF NOT EXISTS public.usuarios_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT,
  nombre_completo TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  sede_id TEXT,
  sede_nombre TEXT,
  cargo TEXT,
  usuario_interno TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'ventas'
    CHECK (rol IN ('admin', 'ventas', 'tecnico')),
  estado TEXT NOT NULL DEFAULT 'invitado'
    CHECK (estado IN ('activo', 'invitado', 'inactivo')),
  autenticacion_2fa TEXT NOT NULL DEFAULT 'obligatorio'
    CHECK (autenticacion_2fa IN ('obligatorio', 'opcional', 'deshabilitado')),
  enviar_invitacion TEXT,
  has_2fa BOOLEAN NOT NULL DEFAULT false,
  es_borrador BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, correo),
  UNIQUE (user_id, usuario_interno)
);

CREATE INDEX IF NOT EXISTS usuarios_empresa_user_estado_idx
  ON public.usuarios_empresa (user_id, estado);

CREATE INDEX IF NOT EXISTS usuarios_empresa_user_nombre_lower_idx
  ON public.usuarios_empresa (user_id, lower(nombre_completo));

ALTER TABLE public.usuarios_empresa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own usuarios_empresa" ON public.usuarios_empresa;
DROP POLICY IF EXISTS "Users can insert own usuarios_empresa" ON public.usuarios_empresa;
DROP POLICY IF EXISTS "Users can update own usuarios_empresa" ON public.usuarios_empresa;
DROP POLICY IF EXISTS "Users can delete own usuarios_empresa" ON public.usuarios_empresa;

CREATE POLICY "Users can select own usuarios_empresa" ON public.usuarios_empresa
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usuarios_empresa" ON public.usuarios_empresa
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own usuarios_empresa" ON public.usuarios_empresa
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own usuarios_empresa" ON public.usuarios_empresa
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_usuarios_empresa_updated_at ON public.usuarios_empresa;
CREATE TRIGGER update_usuarios_empresa_updated_at
  BEFORE UPDATE ON public.usuarios_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
