import { supabase } from "@/integrations/supabase/client";
import type { GuiaRemisionRow } from "@/lib/logistica/guia-report-import";

export type GuiaImportSummary = {
  guiasInsertadas: number;
  guiasActualizadas: number;
  itemsInsertados: number;
  kardexMovimientos: number;
  ventasVinculadas: number;
  productosNoEncontrados: number;
};

type ProductoMatch = {
  id: string;
  stock: number;
  costo: number;
  unidad: string;
  almacen: string;
};

async function findProducto(
  userId: string,
  codigo: string | undefined,
  descripcion: string,
): Promise<ProductoMatch | null> {
  if (codigo?.trim()) {
    const { data } = await supabase
      .from("productos")
      .select("id, stock, costo, unidad, almacen")
      .eq("user_id", userId)
      .ilike("sku", codigo.trim())
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        id: data.id,
        stock: Number(data.stock),
        costo: Number(data.costo ?? 0),
        unidad: data.unidad,
        almacen: data.almacen ?? "Almacén Principal",
      };
    }
  }

  const fragment = descripcion.slice(0, 40).trim();
  if (!fragment) return null;

  const { data } = await supabase
    .from("productos")
    .select("id, stock, costo, unidad, almacen")
    .eq("user_id", userId)
    .ilike("nombre", `%${fragment}%`)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    stock: Number(data.stock),
    costo: Number(data.costo ?? 0),
    unidad: data.unidad,
    almacen: data.almacen ?? "Almacén Principal",
  };
}

export async function importGuiaReporteRows(
  userId: string,
  guias: GuiaRemisionRow[],
): Promise<GuiaImportSummary> {
  const summary: GuiaImportSummary = {
    guiasInsertadas: 0,
    guiasActualizadas: 0,
    itemsInsertados: 0,
    kardexMovimientos: 0,
    ventasVinculadas: 0,
    productosNoEncontrados: 0,
  };

  if (!guias.length) return summary;

  const codigos = guias.map((guia) => guia.codigoGuia);
  const { data: existingGuias } = await supabase
    .from("guias_remision" as "productos")
    .select("id, codigo_guia")
    .eq("user_id", userId)
    .in("codigo_guia", codigos);

  const existingMap = new Map(
    ((existingGuias ?? []) as Array<{ id: string; codigo_guia: string }>).map((row) => [
      row.codigo_guia,
      row.id,
    ]),
  );

  const comprobantes = [
    ...new Set(
      guias
        .map((guia) => guia.comprobanteRelacionado)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const ventaIdByCodigo = new Map<string, string>();
  if (comprobantes.length) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select("id, codigo_comprobante")
      .eq("user_id", userId)
      .in("codigo_comprobante", comprobantes);

    for (const venta of ventas ?? []) {
      ventaIdByCodigo.set(venta.codigo_comprobante, venta.id);
    }
  }

  for (const guia of guias) {
    const ventaId = guia.comprobanteRelacionado
      ? ventaIdByCodigo.get(guia.comprobanteRelacionado) ?? null
      : null;
    if (ventaId) summary.ventasVinculadas += 1;

    const notas = [
      `Importado desde ${guia.archivoOrigen}`,
      guia.comprobanteRelacionado ? `Comprobante: ${guia.comprobanteRelacionado}` : null,
      guia.observacion ? `Obs: ${guia.observacion}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const payload = {
      user_id: userId,
      codigo_guia: guia.codigoGuia,
      numero: guia.codigoGuia,
      serie: guia.serie,
      numero_correlativo: guia.numero,
      fecha_emision: guia.fechaEmision,
      fecha_traslado: guia.fechaTraslado,
      motivo_traslado: guia.motivoTraslado,
      sucursal: guia.sucursal || null,
      destinatario_ruc: guia.destinatarioRuc || null,
      destinatario_nombre: guia.destinatarioNombre,
      direccion_partida: guia.direccionPartida || null,
      direccion_destino: guia.direccionDestino || null,
      conductor_ruc: guia.conductorRuc || null,
      conductor_nombre: guia.conductorNombre || null,
      licencia: guia.licencia || null,
      placa: guia.placa || null,
      peso_total: guia.pesoTotal,
      bultos: guia.bultos || null,
      observacion: guia.observacion || null,
      comprobante_relacionado: guia.comprobanteRelacionado ?? null,
      venta_id: ventaId,
      estado: guia.estado,
      estado_sunat: "aceptado",
      periodo_mes: guia.periodoMes,
      fuente_archivo: guia.archivoOrigen,
      notas,
    };

    const existed = existingMap.has(guia.codigoGuia);
    const { data: savedGuia, error: guiaError } = await supabase
      .from("guias_remision" as "productos")
      .upsert(payload as never, { onConflict: "user_id,codigo_guia" })
      .select("id")
      .single();

    if (guiaError || !savedGuia) {
      console.warn("[guias-import]", guiaError?.message ?? "No se pudo guardar guía");
      continue;
    }

    if (existed) summary.guiasActualizadas += 1;
    else summary.guiasInsertadas += 1;

    const guiaId = (savedGuia as { id: string }).id;
    existingMap.set(guia.codigoGuia, guiaId);

    await supabase
      .from("guia_remision_items" as "productos")
      .delete()
      .eq("guia_id", guiaId)
      .eq("user_id", userId);

    for (const item of guia.items) {
      const producto = await findProducto(userId, item.codigo, item.descripcion);
      if (!producto) summary.productosNoEncontrados += 1;

      const { error: itemError } = await supabase.from("guia_remision_items" as "productos").insert({
        guia_id: guiaId,
        user_id: userId,
        producto_id: producto?.id ?? null,
        codigo: item.codigo ?? null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidad: item.unidad,
        peso_unitario: item.pesoUnitario ?? null,
      } as never);

      if (!itemError) summary.itemsInsertados += 1;

      if (!producto || guia.estado === "anulada") continue;

      const { data: existingKardex } = await supabase
        .from("kardex_movimientos" as "productos")
        .select("id")
        .eq("user_id", userId)
        .eq("producto_id", producto.id)
        .eq("documento_referencia", guia.codigoGuia)
        .limit(1)
        .maybeSingle();

      if (existingKardex) continue;

      const costoTotal = item.cantidad * producto.costo;
      const { error: kardexError } = await supabase.from("kardex_movimientos" as "productos").insert({
        user_id: userId,
        producto_id: producto.id,
        almacen_origen: guia.sucursal || producto.almacen,
        tipo: "salida",
        cantidad: item.cantidad,
        unidad: item.unidad || producto.unidad,
        costo_unitario: producto.costo,
        costo_total: costoTotal,
        motivo: `Guía de remisión ${guia.codigoGuia} (${guia.motivoTraslado})`,
        responsable: guia.conductorNombre || "Logística",
        documento_referencia: guia.codigoGuia,
        estado: "completado",
        fecha_movimiento: guia.fechaTraslado,
      } as never);

      if (!kardexError) {
        summary.kardexMovimientos += 1;
        await supabase
          .from("productos")
          .update({
            stock: Math.max(0, producto.stock - item.cantidad),
            ultimo_movimiento_at: new Date().toISOString(),
          })
          .eq("id", producto.id)
          .eq("user_id", userId);
      }
    }
  }

  return summary;
}

export async function importGuiasLegacyFromDatabase(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("import_guias_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
