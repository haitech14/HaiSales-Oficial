-- Eliminar datos de prueba sembrados por servicios frontend (planillas, inventario, logística)

DELETE FROM public.orden_compra_items
WHERE orden_id IN (
  SELECT id FROM public.ordenes_compra
  WHERE numero LIKE 'OC-2026-%'
     OR notas LIKE 'Orden demo importada%'
);

DELETE FROM public.ordenes_compra
WHERE numero LIKE 'OC-2026-%'
   OR notas LIKE 'Orden demo importada%';

DELETE FROM public.productos
WHERE sku IN (
  'PROD-000123', 'PROD-000124', 'PROD-000125', 'PROD-000126', 'PROD-000127',
  'PROD-000128', 'PROD-000129', 'PROD-000130', 'SERV-000045', 'KIT-000012'
);

DELETE FROM public.trabajadores
WHERE codigo IN (
  'TR-0001', 'TR-0002', 'TR-0003', 'TR-0004', 'TR-0005',
  'TR-0006', 'TR-0007', 'TR-0008', 'TR-0009', 'TR-0010'
)
OR dni IN (
  '45123678', '40789456', '72349851', '09876543', '55432198',
  '41234567', '67890123', '33445566', '77889900', '22334455'
);

CREATE OR REPLACE FUNCTION public.clear_demo_data_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.inbox_messages
  WHERE user_id = p_user_id
    AND conversation_id IN (
      SELECT id FROM public.inbox_conversations
      WHERE user_id = p_user_id
        AND external_id IN ('wa-demo-001', 'fb-demo-002', 'em-demo-003')
    );

  DELETE FROM public.inbox_conversations
  WHERE user_id = p_user_id
    AND external_id IN ('wa-demo-001', 'fb-demo-002', 'em-demo-003');

  DELETE FROM public.cuentas_cobrar
  WHERE user_id = p_user_id
    AND documento IN ('F001-00001248');

  DELETE FROM public.ventas
  WHERE user_id = p_user_id
    AND numero IN ('F001-00001248', 'B001-00004521');

  DELETE FROM public.asiento_lineas
  WHERE asiento_id IN (
    SELECT id FROM public.asientos_contables
    WHERE user_id = p_user_id AND codigo = 'AS-000148'
  );

  DELETE FROM public.asientos_contables
  WHERE user_id = p_user_id AND codigo = 'AS-000148';

  DELETE FROM public.cotizaciones
  WHERE user_id = p_user_id AND codigo = 'COT-000087';

  DELETE FROM public.oportunidades
  WHERE user_id = p_user_id
    AND codigo IN ('OP-000119', 'OP-000120', 'OP-000121', 'OP-000122', 'OP-000123');

  DELETE FROM public.actividades_comerciales
  WHERE user_id = p_user_id
    AND titulo IN (
      'Llamadas por realizar',
      'Reuniones agendadas',
      'Correos por enviar',
      'Seguimientos pendientes'
    );

  DELETE FROM public.plan_cuentas
  WHERE user_id = p_user_id
    AND codigo IN ('1211', '4011', '7011', '6311');

  DELETE FROM public.clientes
  WHERE user_id = p_user_id
    AND ruc IN ('20123456789', '20567891234', '20456789123', '20678912345');

  DELETE FROM public.almacenes
  WHERE user_id = p_user_id
    AND nombre IN ('Almacén Central', 'Almacén Norte', 'Almacén Sur');

  DELETE FROM public.movimientos_tesoreria
  WHERE user_id = p_user_id
    AND documento = 'INI-0001';

  DELETE FROM public.cuentas_tesoreria
  WHERE user_id = p_user_id
    AND nombre IN ('BCP Soles', 'BBVA Soles', 'Caja Chica');

  DELETE FROM public.orden_compra_items
  WHERE orden_id IN (
    SELECT id FROM public.ordenes_compra
    WHERE user_id = p_user_id
      AND (numero LIKE 'OC-2026-%' OR notas LIKE 'Orden demo importada%')
  );

  DELETE FROM public.ordenes_compra
  WHERE user_id = p_user_id
    AND (numero LIKE 'OC-2026-%' OR notas LIKE 'Orden demo importada%');

  DELETE FROM public.productos
  WHERE user_id = p_user_id
    AND sku IN (
      'PROD-000123', 'PROD-000124', 'PROD-000125', 'PROD-000126', 'PROD-000127',
      'PROD-000128', 'PROD-000129', 'PROD-000130', 'SERV-000045', 'KIT-000012'
    );

  DELETE FROM public.trabajadores
  WHERE user_id = p_user_id
    AND (
      codigo IN (
        'TR-0001', 'TR-0002', 'TR-0003', 'TR-0004', 'TR-0005',
        'TR-0006', 'TR-0007', 'TR-0008', 'TR-0009', 'TR-0010'
      )
      OR dni IN (
        '45123678', '40789456', '72349851', '09876543', '55432198',
        '41234567', '67890123', '33445566', '77889900', '22334455'
      )
    );

  UPDATE public.empresa_config
  SET demo_cleanup_dismissed = true
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_demo_data_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_demo_data_for_user(UUID) TO authenticated;
