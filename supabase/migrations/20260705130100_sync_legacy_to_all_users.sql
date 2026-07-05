-- Sincroniza datos legacy de staging hacia tablas operativas por usuario

DO $$
DECLARE
  uid UUID;
  clientes_count INTEGER;
  productos_count INTEGER;
  ventas_count INTEGER;
  items_count INTEGER;
  guias_count INTEGER;
BEGIN
  FOR uid IN SELECT id FROM auth.users LOOP
    clientes_count := public.import_clientes_legacy_for_user(uid);
    productos_count := public.import_productos_legacy_for_user(uid);
    ventas_count := public.import_ventas_legacy_for_user(uid);
    items_count := public.import_venta_items_legacy_for_user(uid);
    guias_count := public.import_guias_legacy_for_user(uid);
    PERFORM public.sync_prospeccion_sin_compra_for_user(uid);

    RAISE NOTICE 'Usuario %: clientes=%, productos=%, ventas=%, items=%, guias=%',
      uid, clientes_count, productos_count, ventas_count, items_count, guias_count;
  END LOOP;
END $$;
