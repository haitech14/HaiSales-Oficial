import { supabase } from "@/integrations/supabase/client";
import { appNavSections, dashboardNavGroup } from "@/lib/app-navigation";
import type { GlobalSearchCategory, GlobalSearchResult } from "@/lib/global-search/global-search-types";

const RESULT_LIMIT = 6;

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

function buildHref(path: string, query: string) {
  const params = new URLSearchParams({ q: query });
  return `${path}?${params.toString()}`;
}

function extractMatchingSerieToken(descripcion: string, query: string): string | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery || !descripcion.toLowerCase().includes(normalizedQuery)) {
    return null;
  }

  const tokens = descripcion.match(/[A-Za-z0-9][A-Za-z0-9]{4,}/g) ?? [];
  const tokenMatch = tokens.find((token) => token.toLowerCase().includes(normalizedQuery));
  if (tokenMatch) return tokenMatch.toUpperCase();

  const serieLabel = descripcion.match(/serie\s*:?\s*([A-Za-z0-9]+)/i)?.[1];
  if (serieLabel?.toLowerCase().includes(normalizedQuery)) {
    return serieLabel.toUpperCase();
  }

  return null;
}

function shortenItemHint(descripcion: string) {
  const line = descripcion.split(/\r?\n/)[0]?.trim() ?? descripcion.trim();
  if (line.length <= 72) return line;
  return `${line.slice(0, 69)}...`;
}

function buildComprobanteResult(input: {
  id: string;
  codigo: string;
  tipo?: string | null;
  cliente?: string | null;
  fecha?: string | null;
  serieEquipo?: string | null;
  itemHint?: string | null;
  hrefQuery: string;
}): GlobalSearchResult {
  const codigo = input.codigo.trim();
  const serie = input.serieEquipo?.trim();

  return {
    id: input.id,
    category: "comprobante",
    title: serie ? `Serie ${serie}` : codigo,
    subtitle: [
      codigo,
      input.tipo,
      input.cliente,
      input.fecha,
      input.itemHint && !serie ? input.itemHint : null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: buildHref("/app/ventas", input.hrefQuery),
  };
}

function mergeComprobanteResults(results: GlobalSearchResult[]): GlobalSearchResult[] {
  const byCodigo = new Map<string, GlobalSearchResult>();

  for (const result of results) {
    const codigo = result.subtitle?.split(" · ")[0]?.trim() ?? result.title;
    const existing = byCodigo.get(codigo);
    if (!existing || result.title.startsWith("Serie ")) {
      byCodigo.set(codigo, result);
    }
  }

  return Array.from(byCodigo.values()).slice(0, RESULT_LIMIT);
}

function searchModules(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const entries: Array<{ label: string; href: string; hint?: string }> = [
    { label: dashboardNavGroup.label, href: dashboardNavGroup.href ?? "/app/dashboard" },
    ...appNavSections.flatMap((section) =>
      section.items
        .filter((item) => item.href)
        .map((item) => ({ label: item.label, href: item.href! })),
    ),
  ];

  return entries
    .filter((entry) => entry.label.toLowerCase().includes(normalized))
    .slice(0, 5)
    .map((entry) => ({
      id: `modulo-${entry.href}`,
      category: "modulo" as const,
      title: entry.label,
      subtitle: "Ir al módulo",
      href: buildHref(entry.href, query),
    }));
}

async function searchClientes(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const { data, error } = await supabase
    .from("clientes")
    .select("id, razon_social, ruc, contacto_nombre, telefono, correo, email, modelos_interes")
    .eq("user_id", userId)
    .or(
      [
        `razon_social.ilike.${pattern}`,
        `ruc.ilike.${pattern}`,
        `contacto_nombre.ilike.${pattern}`,
        `telefono.ilike.${pattern}`,
        `correo.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `modelos_interes.ilike.${pattern}`,
        `observaciones.ilike.${pattern}`,
      ].join(","),
    )
    .limit(RESULT_LIMIT);

  if (error || !data) {
    console.warn("[global-search] clientes:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: `cliente-${row.id}`,
    category: "cliente",
    title: row.razon_social,
    subtitle: [row.ruc, row.contacto_nombre].filter(Boolean).join(" · ") || undefined,
    href: buildHref("/app/clientes", row.razon_social),
  }));
}

async function searchContactos(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const { data, error } = await supabase
    .from("clientes")
    .select("id, razon_social, contacto_nombre, telefono, correo, email")
    .eq("user_id", userId)
    .not("contacto_nombre", "is", null)
    .or(
      [
        `contacto_nombre.ilike.${pattern}`,
        `telefono.ilike.${pattern}`,
        `correo.ilike.${pattern}`,
        `email.ilike.${pattern}`,
      ].join(","),
    )
    .limit(RESULT_LIMIT);

  if (error || !data) {
    console.warn("[global-search] contactos:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: `contacto-${row.id}`,
    category: "contacto",
    title: row.contacto_nombre ?? "Contacto",
    subtitle: [row.razon_social, row.telefono, row.correo ?? row.email].filter(Boolean).join(" · "),
    href: buildHref("/app/clientes", row.contacto_nombre ?? row.razon_social),
  }));
}

async function searchComprobantes(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const legacyClient = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const [ventasResult, itemsResult, legacyItemsResult, legacyVentasResult] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, numero, codigo_comprobante, cliente_nombre, cliente_ruc, tipo_comprobante, fecha")
      .eq("user_id", userId)
      .neq("estado", "anulada")
      .or(
        [
          `numero.ilike.${pattern}`,
          `codigo_comprobante.ilike.${pattern}`,
          `cliente_nombre.ilike.${pattern}`,
          `cliente_ruc.ilike.${pattern}`,
          `notas.ilike.${pattern}`,
        ].join(","),
      )
      .limit(RESULT_LIMIT),
    supabase
      .from("venta_items")
      .select(
        "id, descripcion, ventas!inner(id, codigo_comprobante, numero, cliente_nombre, cliente_ruc, tipo_comprobante, fecha, estado, user_id)",
      )
      .eq("ventas.user_id", userId)
      .neq("ventas.estado", "anulada")
      .ilike("descripcion", pattern)
      .limit(RESULT_LIMIT * 2),
    legacyClient
      .from("venta_legacy_import_items")
      .select(
        "codigo_comprobante, descripcion, cliente_nombre, cliente_ruc, fecha, tipo_comprobante, serie",
      )
      .or([`descripcion.ilike.${pattern}`, `serie.ilike.${pattern}`].join(","))
      .limit(RESULT_LIMIT * 3),
    legacyClient
      .from("ventas_legacy_import")
      .select("codigo_comprobante, cliente_nombre, cliente_ruc, fecha, tipo_comprobante, serie")
      .or(
        [
          `serie.ilike.${pattern}`,
          `codigo_comprobante.ilike.${pattern}`,
          `numero.ilike.${pattern}`,
        ].join(","),
      )
      .limit(RESULT_LIMIT),
  ]);

  const results: GlobalSearchResult[] = [];

  if (ventasResult.error) {
    console.warn("[global-search] comprobantes:", ventasResult.error.message);
  } else {
    for (const row of ventasResult.data ?? []) {
      const codigo = row.codigo_comprobante ?? row.numero;
      results.push(
        buildComprobanteResult({
          id: `venta-${row.id}`,
          codigo,
          tipo: row.tipo_comprobante,
          cliente: row.cliente_nombre,
          fecha: row.fecha,
          hrefQuery: codigo,
        }),
      );
    }
  }

  if (itemsResult.error) {
    console.warn("[global-search] venta_items:", itemsResult.error.message);
  } else {
    for (const row of itemsResult.data ?? []) {
      const venta = row.ventas as {
        id: string;
        codigo_comprobante: string | null;
        numero: string;
        cliente_nombre: string | null;
        tipo_comprobante: string;
        fecha: string;
      };
      const codigo = venta.codigo_comprobante ?? venta.numero;
      const serieEquipo = extractMatchingSerieToken(row.descripcion, query);

      results.push(
        buildComprobanteResult({
          id: `venta-item-${row.id}`,
          codigo,
          tipo: venta.tipo_comprobante,
          cliente: venta.cliente_nombre,
          fecha: venta.fecha,
          serieEquipo,
          itemHint: shortenItemHint(row.descripcion),
          hrefQuery: serieEquipo ?? codigo,
        }),
      );
    }
  }

  const legacyCodigos = new Set<string>();
  for (const row of legacyItemsResult.data ?? []) {
    if (row.codigo_comprobante) legacyCodigos.add(row.codigo_comprobante);
  }
  for (const row of legacyVentasResult.data ?? []) {
    if (row.codigo_comprobante) legacyCodigos.add(row.codigo_comprobante);
  }

  let userVentasByCodigo = new Map<
    string,
    { id: string; cliente_nombre: string | null; fecha: string; tipo_comprobante: string }
  >();

  if (legacyCodigos.size > 0) {
    const { data: userVentas, error } = await supabase
      .from("ventas")
      .select("id, codigo_comprobante, cliente_nombre, fecha, tipo_comprobante")
      .eq("user_id", userId)
      .neq("estado", "anulada")
      .in("codigo_comprobante", Array.from(legacyCodigos));

    if (error) {
      console.warn("[global-search] ventas legacy match:", error.message);
    } else {
      userVentasByCodigo = new Map(
        (userVentas ?? [])
          .filter((venta) => venta.codigo_comprobante)
          .map((venta) => [venta.codigo_comprobante!, venta]),
      );
    }
  }

  if (legacyItemsResult.error) {
    console.warn("[global-search] venta_legacy_import_items:", legacyItemsResult.error.message);
  } else {
    for (const row of legacyItemsResult.data ?? []) {
      const venta = userVentasByCodigo.get(row.codigo_comprobante);
      if (!venta) continue;

      const serieEquipo = extractMatchingSerieToken(row.descripcion, query) ?? (
        row.serie?.toLowerCase().includes(query.trim().toLowerCase()) ? row.serie : null
      );

      results.push(
        buildComprobanteResult({
          id: `legacy-item-${row.codigo_comprobante}-${row.descripcion.slice(0, 24)}`,
          codigo: row.codigo_comprobante,
          tipo: row.tipo_comprobante ?? venta.tipo_comprobante,
          cliente: row.cliente_nombre ?? venta.cliente_nombre,
          fecha: row.fecha ?? venta.fecha,
          serieEquipo,
          itemHint: shortenItemHint(row.descripcion),
          hrefQuery: serieEquipo ?? row.codigo_comprobante,
        }),
      );
    }
  }

  if (legacyVentasResult.error) {
    console.warn("[global-search] ventas_legacy_import:", legacyVentasResult.error.message);
  } else {
    for (const row of legacyVentasResult.data ?? []) {
      const venta = userVentasByCodigo.get(row.codigo_comprobante);
      if (!venta) continue;

      results.push(
        buildComprobanteResult({
          id: `legacy-venta-${row.codigo_comprobante}`,
          codigo: row.codigo_comprobante,
          tipo: row.tipo_comprobante ?? venta.tipo_comprobante,
          cliente: row.cliente_nombre ?? venta.cliente_nombre,
          fecha: row.fecha ?? venta.fecha,
          serieEquipo: row.serie?.toLowerCase().includes(query.trim().toLowerCase())
            ? row.serie.toUpperCase()
            : null,
          hrefQuery: row.serie ?? row.codigo_comprobante,
        }),
      );
    }
  }

  return mergeComprobanteResults(results);
}

async function searchGuias(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const guiasTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await guiasTable
    .from("guias_remision")
    .select("id, codigo_guia, destinatario_nombre, destinatario_ruc, comprobante_relacionado, placa, fecha_emision")
    .eq("user_id", userId)
    .or(
      [
        `codigo_guia.ilike.${pattern}`,
        `destinatario_nombre.ilike.${pattern}`,
        `destinatario_ruc.ilike.${pattern}`,
        `comprobante_relacionado.ilike.${pattern}`,
        `placa.ilike.${pattern}`,
        `observacion.ilike.${pattern}`,
      ].join(","),
    )
    .limit(RESULT_LIMIT);

  if (error || !data) {
    console.warn("[global-search] guías:", error?.message);
    return [];
  }

  return (data as Array<{
    id: string;
    codigo_guia: string;
    destinatario_nombre: string;
    destinatario_ruc: string | null;
    comprobante_relacionado: string | null;
    placa: string | null;
    fecha_emision: string;
  }>).map((row) => ({
    id: `guia-${row.id}`,
    category: "guia",
    title: row.codigo_guia,
    subtitle: [row.destinatario_nombre, row.comprobante_relacionado, row.placa].filter(Boolean).join(" · "),
    href: buildHref("/app/logistica", row.codigo_guia),
  }));
}

async function searchProductos(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const { data, error } = await supabase
    .from("productos")
    .select("id, sku, nombre, marca_modelo, categoria, descripcion")
    .eq("user_id", userId)
    .or(
      [
        `sku.ilike.${pattern}`,
        `nombre.ilike.${pattern}`,
        `marca_modelo.ilike.${pattern}`,
        `descripcion.ilike.${pattern}`,
        `categoria.ilike.${pattern}`,
      ].join(","),
    )
    .limit(RESULT_LIMIT);

  if (error || !data) {
    console.warn("[global-search] productos:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: `producto-${row.id}`,
    category: "producto",
    title: row.nombre,
    subtitle: [row.sku, row.marca_modelo, row.categoria].filter(Boolean).join(" · "),
    href: buildHref("/app/inventario", row.sku ?? row.nombre),
  }));
}

async function searchOportunidades(userId: string, query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlike(query)}%`;
  const { data, error } = await supabase
    .from("oportunidades")
    .select("id, codigo, titulo, cliente_nombre, cliente_ruc, etapa")
    .eq("user_id", userId)
    .or(
      [
        `codigo.ilike.${pattern}`,
        `titulo.ilike.${pattern}`,
        `cliente_nombre.ilike.${pattern}`,
        `cliente_ruc.ilike.${pattern}`,
        `subtitulo.ilike.${pattern}`,
      ].join(","),
    )
    .limit(RESULT_LIMIT);

  if (error || !data) {
    console.warn("[global-search] oportunidades:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: `oportunidad-${row.id}`,
    category: "oportunidad",
    title: row.titulo,
    subtitle: [row.codigo, row.cliente_nombre, row.etapa].filter(Boolean).join(" · "),
    href: buildHref("/app/pipeline", row.codigo),
  }));
}

function searchPlanesSuministro(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  const keywords = ["plan", "suministro", "mantenimiento", "toner", "serie", "equipo"];
  if (!keywords.some((word) => normalized.includes(word))) {
    return [];
  }

  return [
    {
      id: "modulo-planes-suministro",
      category: "modulo",
      title: "Planes de Mantenimiento y Suministro",
      subtitle: "Programa mantenimientos, repuestos y suministros",
      href: buildHref("/app/planes-mantenimiento-suministro", query),
    },
  ];
}

export async function searchGlobally(
  userId: string | null,
  query: string,
): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!userId || trimmed.length < 2) {
    return [];
  }

  const [clientes, contactos, comprobantes, guias, productos, oportunidades] = await Promise.all([
    searchClientes(userId, trimmed),
    searchContactos(userId, trimmed),
    searchComprobantes(userId, trimmed),
    searchGuias(userId, trimmed),
    searchProductos(userId, trimmed),
    searchOportunidades(userId, trimmed),
  ]);

  const modules = [...searchModules(trimmed), ...searchPlanesSuministro(trimmed)];

  return [
    ...clientes,
    ...contactos,
    ...comprobantes,
    ...guias,
    ...productos,
    ...oportunidades,
    ...modules,
  ];
}

export function groupResultsByCategory(
  results: GlobalSearchResult[],
): Array<{ category: GlobalSearchCategory; items: GlobalSearchResult[] }> {
  const order: GlobalSearchCategory[] = [
    "cliente",
    "contacto",
    "comprobante",
    "guia",
    "producto",
    "oportunidad",
    "modulo",
  ];

  return order
    .map((category) => ({
      category,
      items: results.filter((result) => result.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
