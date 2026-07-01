-- Función de seed demo por usuario (idempotente)

CREATE OR REPLACE FUNCTION public.seed_demo_data_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id UUID;
  v_asiento_id UUID;
  v_venta_id UUID;
  v_cuenta_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Almacenes
  IF NOT EXISTS (SELECT 1 FROM public.almacenes WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.almacenes (user_id, nombre, ubicacion, responsable) VALUES
      (p_user_id, 'Almacén Central', 'Lima', 'Jhelcen Romero'),
      (p_user_id, 'Almacén Norte', 'Lima Norte', 'Ana Martínez'),
      (p_user_id, 'Almacén Sur', 'Lima Sur', 'Juan Campos');
  END IF;

  -- Clientes demo
  IF NOT EXISTS (SELECT 1 FROM public.clientes WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.clientes (
      user_id, razon_social, ruc, telefono, email, contacto_nombre, contacto_cargo,
      segmento, estado_comercial, ejecutivo_nombre, ejecutivo_iniciales, distrito, fecha_alta
    ) VALUES
      (p_user_id, 'DISTRIBUIDORA ANDINA S.A.C.', '20123456789', '+51 999 123 456', 'contacto@andina.pe',
       'María López', 'Gerente General', 'Corporativo', 'activo', 'Jhelcen Romero', 'JR', 'San Isidro', '2024-03-15'),
      (p_user_id, 'TECH SOLUTIONS PERÚ S.A.C.', '20567891234', '+51 987 654 321', 'ventas@tech.pe',
       'Carlos Ruiz', 'Director Comercial', 'Corporativo', 'activo', 'Ana Martínez', 'AM', 'Miraflores', '2024-01-22'),
      (p_user_id, 'FERRETERÍA CENTRAL E.I.R.L.', '20456789123', '+51 976 543 210', NULL,
       'Pedro Sánchez', 'Propietario', 'PYME', 'con_deuda', 'Juan Campos', 'JC', 'Ate', '2023-11-08'),
      (p_user_id, 'INNOVA LOGÍSTICA S.A.C.', '20678912345', '+51 965 432 109', 'compras@innova.pe',
       'Lucía Torres', 'Jefa de Compras', 'Corporativo', 'prospecto', 'Jhelcen Romero', 'JR', 'Surco', '2024-06-30');
  END IF;

  -- Oportunidades demo
  IF NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.oportunidades (
      user_id, codigo, cliente_nombre, cliente_ruc, titulo, subtitulo, valor, etapa,
      probabilidad, responsable_nombre, responsable_iniciales, fecha_oportunidad
    ) VALUES
      (p_user_id, 'OP-000123', 'CORPORACIÓN ABC S.A.C.', '20123456789', 'Renovación de licencia ERP',
       'Renovación anual + 5 usuarios adicionales', 48750, 'Negociación', 70, 'Jhelcen Romero', 'JR', '2026-06-30 10:35:00+00'),
      (p_user_id, 'OP-000122', 'INVERSIONES SUR S.A.C.', '20567891234', 'Implementación CRM y capacitación',
       'CRM + 2 días de capacitación presencial', 32400, 'Propuesta', 55, 'Ana Martínez', 'AM', '2026-06-30 09:10:00+00'),
      (p_user_id, 'OP-000121', 'DISTRIBUIDORA NORTE E.I.R.L.', '20456789123', 'Plan anual de soporte',
       'Soporte premium 12 meses', 18900, 'Calificación', 40, 'Juan Campos', 'JC', '2026-06-29 16:44:00+00'),
      (p_user_id, 'OP-000120', 'SERVICIOS INTEGRALES S.A.C.', '20345678912', 'Migración de datos históricos',
       'Importación de 3 años de ventas', 26150, 'Prospectos', 25, 'Jhelcen Romero', 'JR', '2026-06-29 11:05:00+00'),
      (p_user_id, 'OP-000119', 'GRUPO LOGÍSTICO PERÚ S.A.C.', '20678912345', 'Licencias adicionales usuarios',
       'Ampliación a 15 usuarios', 52300, 'Cierre ganado', 100, 'Ana Martínez', 'AM', '2026-06-28 15:22:00+00');
  END IF;

  -- Actividades comerciales demo
  IF NOT EXISTS (SELECT 1 FROM public.actividades_comerciales WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.actividades_comerciales (user_id, tipo, estado, titulo, fecha_programada) VALUES
      (p_user_id, 'llamada', 'pendiente', 'Llamadas por realizar', now() + interval '1 day'),
      (p_user_id, 'reunion', 'pendiente', 'Reuniones agendadas', now() + interval '2 days'),
      (p_user_id, 'correo', 'pendiente', 'Correos por enviar', now() + interval '3 days'),
      (p_user_id, 'seguimiento', 'pendiente', 'Seguimientos pendientes', now() + interval '4 days');
  END IF;

  -- Plan de cuentas demo
  IF NOT EXISTS (SELECT 1 FROM public.plan_cuentas WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.plan_cuentas (user_id, codigo, nombre, tipo, nivel) VALUES
      (p_user_id, '1211', 'Cuentas por cobrar comerciales', 'activo', 4),
      (p_user_id, '4011', 'IGV por pagar', 'pasivo', 4),
      (p_user_id, '7011', 'Ventas de mercaderías', 'ingreso', 4),
      (p_user_id, '6311', 'Gastos de administración', 'gasto', 4);
  END IF;

  -- Asiento contable demo
  IF NOT EXISTS (SELECT 1 FROM public.asientos_contables WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.asientos_contables (
      user_id, codigo, fecha, hora_emision, glosa, seccion, estado, documento_ref, total_debe, total_haber
    ) VALUES (
      p_user_id, 'AS-000148', '2026-03-15', '10:24', 'Venta a crédito — Distribuidora Norte SAC',
      'asientos', 'publicado', 'F001-00001248', 4850, 4850
    ) RETURNING id INTO v_asiento_id;

    INSERT INTO public.asiento_lineas (asiento_id, cuenta_codigo, cuenta_nombre, descripcion, debe, haber) VALUES
      (v_asiento_id, '1211', 'Cuentas por cobrar comerciales', 'Venta a crédito — Distribuidora Norte SAC', 4850, NULL),
      (v_asiento_id, '7011', 'Ventas de mercaderías', 'Ingreso por venta de mercaderías', NULL, 4112),
      (v_asiento_id, '4011', 'IGV por pagar', 'IGV generado en venta', NULL, 738);
  END IF;

  -- Ventas / comprobantes demo
  IF NOT EXISTS (SELECT 1 FROM public.ventas WHERE user_id = p_user_id LIMIT 1) THEN
    SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = p_user_id ORDER BY created_at LIMIT 1;

    INSERT INTO public.ventas (
      user_id, cliente_id, numero, fecha, hora_emision, estado, moneda, subtotal, igv, total,
      tipo_comprobante, codigo_comprobante, estado_sunat, vendedor_nombre, vendedor_iniciales,
      tiene_cdr, cliente_nombre, cliente_ruc
    ) VALUES (
      p_user_id, v_cliente_id, 'F001-00001248', '2026-03-15', '10:24', 'confirmada', 'PEN',
      4112, 738, 4850, 'factura', 'F001-00001248', 'aceptado', 'Jhelcen Romero', 'JR', true,
      'Distribuidora Norte SAC', '20547896321'
    ) RETURNING id INTO v_venta_id;

    INSERT INTO public.ventas (
      user_id, numero, fecha, hora_emision, estado, moneda, subtotal, igv, total,
      tipo_comprobante, codigo_comprobante, estado_sunat, vendedor_nombre, vendedor_iniciales,
      tiene_cdr, cliente_nombre, cliente_ruc
    ) VALUES (
      p_user_id, 'B001-00004521', '2026-03-15', '09:58', 'confirmada', 'PEN',
      271, 49, 320, 'boleta', 'B001-00004521', 'aceptado', 'Ana Martínez', 'AM', true,
      'María López Vargas', '10456782341'
    );
  END IF;

  -- Cuentas por cobrar demo
  IF NOT EXISTS (SELECT 1 FROM public.cuentas_cobrar WHERE user_id = p_user_id LIMIT 1) THEN
    SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = p_user_id ORDER BY created_at LIMIT 1;
    SELECT id INTO v_venta_id FROM public.ventas WHERE user_id = p_user_id ORDER BY created_at LIMIT 1;

    INSERT INTO public.cuentas_cobrar (
      user_id, cliente_id, venta_id, documento, fecha_emision, fecha_vencimiento,
      monto, saldo_pendiente, estado, dias_mora
    ) VALUES (
      p_user_id, v_cliente_id, v_venta_id, 'F001-00001248', '2026-03-15', '2026-04-15',
      4850, 4850, 'pendiente', 0
    ) RETURNING id INTO v_cuenta_id;
  END IF;

  -- Cotización demo
  IF NOT EXISTS (SELECT 1 FROM public.cotizaciones WHERE user_id = p_user_id LIMIT 1) THEN
    SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = p_user_id ORDER BY created_at LIMIT 1;

    INSERT INTO public.cotizaciones (
      user_id, cliente_id, codigo, estado, subtotal, igv, total, vendedor_nombre
    ) VALUES (
      p_user_id, v_cliente_id, 'COT-000087', 'enviada', 10000, 1800, 11800, 'Jhelcen Romero'
    );
  END IF;

  -- Inbox demo
  IF NOT EXISTS (SELECT 1 FROM public.inbox_conversations WHERE user_id = p_user_id LIMIT 1) THEN
    INSERT INTO public.inbox_conversations (
      user_id, channel, external_id, contact_name, contact_identifier,
      last_message, last_message_at, stage, priority, advisor_name, advisor_initials, campaign
    ) VALUES
      (p_user_id, 'whatsapp', 'wa-demo-001', 'María González', '+51999123456',
       '¿Tienen plan anual con soporte?', now() - interval '15 minutes', 'seguimiento', 'alta',
       'Jhelcen Romero', 'JR', 'WhatsApp Ads'),
      (p_user_id, 'facebook', 'fb-demo-002', 'Carlos Mendoza', 'carlos.mendoza',
       'Quiero una demo del CRM', now() - interval '2 hours', 'nuevo', 'media',
       'Ana Martínez', 'AM', 'Facebook Lead'),
      (p_user_id, 'email', 'em-demo-003', 'Lucía Torres', 'lucia@innova.pe',
       'Cotización módulo inventario', now() - interval '1 day', 'cotizado', 'media',
       'Juan Campos', 'JC', 'Email inbound');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_data_for_user(UUID) TO authenticated;
