import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SyncMode = "full" | "pull" | "push";
type SyncBody = {
  mode?: SyncMode;
  entityType?: "cliente" | "producto";
  entityId?: string;
};

type SyncCounts = {
  clients: number;
  storeProducts: number;
  soporteInventory: number;
  soporteServices: number;
  products: number;
};

type SyncSummary = {
  ok: boolean;
  mode: SyncMode;
  pulled: SyncCounts;
  pushed: SyncCounts;
  errors: string[];
};

const emptyCounts = (): SyncCounts => ({
  clients: 0,
  storeProducts: 0,
  soporteInventory: 0,
  soporteServices: 0,
  products: 0,
});

type StoreProduct = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  brand?: string | null;
  category?: string | null;
  stock?: number | null;
  updated_at?: string | null;
  inventory_snapshot?: {
    code?: string | null;
    brand?: string | null;
    stock?: number | null;
    prices?: Record<string, number> | null;
  } | null;
  prices?: Record<string, number> | null;
};

type SoporteInventory = {
  id: string;
  codigo?: string | null;
  modelo?: string | null;
  marca?: string | null;
  descripcion?: string | null;
  tipo_producto?: string | null;
  precio_corporativo_soles?: number | null;
  precio_corporativo_dolares?: number | null;
  stock?: number | null;
  activo?: boolean | null;
  updated_at?: string | null;
};

type SoporteService = {
  id: string;
  equipment_type?: string | null;
  service_type?: string | null;
  price?: number | null;
  description?: string | null;
  client_type?: string | null;
  updated_at?: string | null;
};

type SoporteClient = {
  id: string;
  nombre: string;
  ruc_dni?: string | null;
  email?: string | null;
  email_secundario?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  distrito?: string | null;
  tipo_cliente?: string | null;
  pipeline_stage?: string | null;
  notas?: string | null;
  nombre_contacto?: string | null;
  produccion_mensual_estimada?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function envOptional(name: string, fallback = ""): string {
  return Deno.env.get(name) ?? fallback;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function usdToPen(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

function mapSegmento(_tipo?: string | null, _pipeline?: string | null): string {
  return "Otros";
}

function mapEstadoComercial(pipeline?: string | null): string {
  const p = (pipeline ?? "").trim().toLowerCase();
  if (p === "prospecto" || p === "lead" || p === "nuevo") return "prospecto";
  if (p === "inactivo" || p === "perdido" || p === "churn" || p === "cerrado") return "inactivo";
  if (p === "deuda" || p === "con_deuda" || p === "moroso") return "con_deuda";
  return "activo";
}

function mapTipoClienteToSoporte(tipo?: string | null): string {
  const t = (tipo ?? "").trim().toLowerCase();
  if (t.includes("técnico") || t.includes("tecnico")) return "tecnico";
  if (t.includes("distribuidor")) return "distribuidor";
  if (t.includes("mayorista")) return "mayorista";
  if (t.includes("corporativo")) return "corporativo";
  return "publico";
}

function mapEstadoToPipeline(estado?: string | null): string {
  const e = (estado ?? "").trim().toLowerCase();
  if (e === "prospecto") return "prospecto";
  if (e === "inactivo") return "inactivo";
  if (e === "con_deuda") return "deuda";
  return "cliente";
}

function soporteInventoryPricePen(row: SoporteInventory, usdRate: number): number {
  const soles = toNumber(row.precio_corporativo_soles);
  const dolares = toNumber(row.precio_corporativo_dolares);
  if (soles > 0) return Math.max(0, soles);
  if (dolares > 0) return usdToPen(Math.max(0, dolares), usdRate);
  return 0;
}

function isServiceProduct(row: Record<string, unknown>): boolean {
  const tipo = String(row.tipo ?? "producto").toLowerCase();
  if (tipo === "service" || tipo === "servicio") return true;
  const sku = String(row.sku ?? "");
  if (sku.startsWith("SVC-")) return true;
  const source = String(row.source_system ?? "");
  return source === "soporte.haitech" && (tipo === "servicio" || tipo === "service" || sku.startsWith("SVC-"));
}

function parseServiceFields(row: Record<string, unknown>): {
  equipment_type: string;
  service_type: string;
  client_type: string;
} {
  const sku = String(row.sku ?? "");
  if (sku.startsWith("SVC-")) {
    const parts = sku.slice(4).split("-");
    const equipment_type = (parts[0] ?? "eq").trim() || "eq";
    const service_type = (parts[1] ?? "svc").trim() || "svc";
    const clientRaw = parts.slice(2).join("-").trim();
    return {
      equipment_type,
      service_type,
      client_type: clientRaw === "all" ? "" : clientRaw,
    };
  }
  return {
    equipment_type: "general",
    service_type: "servicio",
    client_type: "",
  };
}

function storePricePen(row: StoreProduct, usdRate: number): number {
  const inv = row.inventory_snapshot ?? {};
  const prices = row.prices ?? inv.prices ?? {};
  for (const key of ["PEN", "pen", "soles", "Soles", "public"]) {
    if (prices[key] != null) return Math.max(0, toNumber(prices[key]));
  }
  const amount = toNumber(row.price);
  const currency = (row.currency ?? inv.currency ?? "USD").toUpperCase();
  if (currency === "PEN") return Math.max(0, amount);
  return usdToPen(Math.max(0, amount), usdRate);
}

async function restFetch<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`REST ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function fetchAllPages<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const batch = await restFetch<T[]>(
      baseUrl,
      apiKey,
      `${path}${separator}limit=${pageSize}&offset=${offset}`,
    );
    if (!batch?.length) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

async function pullStoreProducts(
  admin: SupabaseClient,
  userId: string,
  storeUrl: string,
  storeKey: string,
  usdRate: number,
  since?: string | null,
): Promise<number> {
  let path =
    "/rest/v1/products?select=id,name,description,price,currency,brand,category,stock,updated_at,inventory_snapshot,prices&order=updated_at.desc";
  if (since) {
    path += `&updated_at=gte.${encodeURIComponent(since)}`;
  }

  const rows = await fetchAllPages<StoreProduct>(storeUrl, storeKey, path);
  let count = 0;

  for (const row of rows) {
    const inv = row.inventory_snapshot ?? {};
    const sku = (inv.code ?? row.id ?? "").toString().slice(0, 80) || null;
    const { error } = await admin.rpc("upsert_producto_from_haitech", {
      p_payload: {
        user_id: userId,
        sku,
        nombre: (row.name ?? "Producto").trim(),
        descripcion: (row.description ?? "").trim() || null,
        precio: storePricePen(row, usdRate),
        stock: Math.max(0, Math.trunc(toNumber(row.stock ?? inv.stock))),
        unidad: "und",
        marca: (row.brand ?? inv.brand ?? "").trim() || null,
        categoria: (row.category ?? "").trim()?.slice(0, 200) || null,
        tipo: "producto",
        moneda: "PEN",
        source_system: "haitech.pe",
        source_id: String(row.id),
        external_updated_at: row.updated_at ?? null,
        activo: true,
      },
    });
    if (!error) count += 1;
  }

  return count;
}

async function pullSoporteClients(
  admin: SupabaseClient,
  userId: string,
  soporteUrl: string,
  soporteKey: string,
  since?: string | null,
): Promise<number> {
  let path =
    "/rest/v1/clients?select=id,nombre,ruc_dni,email,email_secundario,telefono,direccion,ciudad,distrito,tipo_cliente,pipeline_stage,notas,nombre_contacto,produccion_mensual_estimada,created_at,updated_at&order=updated_at.desc";
  if (since) {
    path += `&updated_at=gte.${encodeURIComponent(since)}`;
  }

  const rows = await fetchAllPages<SoporteClient>(soporteUrl, soporteKey, path);
  let count = 0;

  for (const row of rows) {
    const email = (row.email ?? row.email_secundario ?? "").trim() || null;
    const ruc = (row.ruc_dni ?? "").replace(/\D+/g, "") || (row.ruc_dni ?? "").trim() || null;
    const { error } = await admin.rpc("upsert_cliente_from_haitech", {
      p_payload: {
        user_id: userId,
        razon_social: (row.nombre ?? "Sin nombre").trim(),
        ruc,
        correo: email,
        telefono: (row.telefono ?? "").trim() || null,
        direccion: (row.direccion ?? "").trim() || null,
        ciudad: (row.ciudad ?? "").trim() || null,
        distrito: (row.distrito ?? "").trim() || null,
        tipo_cliente: (row.tipo_cliente ?? "").trim() || "Público",
        contacto_nombre: (row.nombre_contacto ?? "").trim() || null,
        notas: (row.notas ?? "").trim() || null,
        observaciones: (row.notas ?? "").trim() || null,
        segmento: mapSegmento(row.tipo_cliente, row.pipeline_stage),
        estado_comercial: mapEstadoComercial(row.pipeline_stage),
        produccion_mensual: row.produccion_mensual_estimada != null
          ? String(row.produccion_mensual_estimada)
          : null,
        fecha_alta: (row.created_at ?? "").slice(0, 10) || null,
        source_system: "soporte.haitech",
        source_id: String(row.id),
        external_updated_at: row.updated_at ?? null,
        activo: true,
      },
    });
    if (!error) count += 1;
  }

  return count;
}

async function pullSoporteInventory(
  admin: SupabaseClient,
  userId: string,
  soporteUrl: string,
  soporteKey: string,
  usdRate: number,
  since?: string | null,
): Promise<number> {
  let path =
    "/rest/v1/inventory_products?select=id,codigo,modelo,marca,descripcion,tipo_producto,precio_corporativo_soles,precio_corporativo_dolares,stock,activo,updated_at&order=updated_at.desc";
  if (since) {
    path += `&updated_at=gte.${encodeURIComponent(since)}`;
  }

  const rows = await fetchAllPages<SoporteInventory>(soporteUrl, soporteKey, path);
  let count = 0;

  for (const row of rows) {
    const tipoLower = (row.tipo_producto ?? "").toLowerCase();
    if (tipoLower.includes("servicio") || tipoLower.includes("service")) continue;

    const sku = ((row.codigo ?? row.modelo ?? row.id) ?? "").toString().slice(0, 80) || null;
    const nombre =
      (row.descripcion ?? [row.marca, row.modelo].filter(Boolean).join(" ")).trim() || "Producto";

    const { error } = await admin.rpc("upsert_producto_from_haitech", {
      p_payload: {
        user_id: userId,
        sku,
        nombre,
        descripcion: (row.descripcion ?? "").trim() || null,
        precio: soporteInventoryPricePen(row, usdRate),
        stock: Math.max(0, Math.trunc(toNumber(row.stock))),
        unidad: "und",
        marca: (row.marca ?? "").trim() || null,
        categoria: (row.tipo_producto ?? "").trim()?.slice(0, 200) || null,
        tipo: "producto",
        moneda: "PEN",
        source_system: "soporte.haitech.inventory",
        source_id: String(row.id),
        external_updated_at: row.updated_at ?? null,
        activo: row.activo !== false,
      },
    });
    if (!error) count += 1;
  }

  return count;
}

async function pullSoporteServices(
  admin: SupabaseClient,
  userId: string,
  soporteUrl: string,
  soporteKey: string,
  since?: string | null,
): Promise<number> {
  let path =
    "/rest/v1/service_prices?select=id,equipment_type,service_type,price,description,client_type,updated_at&order=updated_at.desc";
  if (since) {
    path += `&updated_at=gte.${encodeURIComponent(since)}`;
  }

  const rows = await fetchAllPages<SoporteService>(soporteUrl, soporteKey, path);
  let count = 0;

  for (const row of rows) {
    const eq = (row.equipment_type ?? "eq").trim() || "eq";
    const st = (row.service_type ?? "svc").trim() || "svc";
    const ct = (row.client_type ?? "").trim();
    const sku = `SVC-${eq}-${st}-${ct || "all"}`.slice(0, 80);
    const nombre =
      (row.description ?? "").trim() ||
      `Servicio ${eq.toUpperCase()} / ${st}` + (ct ? ` (${ct})` : "");

    const { error } = await admin.rpc("upsert_producto_from_haitech", {
      p_payload: {
        user_id: userId,
        sku,
        nombre,
        descripcion: (row.description ?? "").trim() || null,
        precio: Math.max(0, toNumber(row.price)),
        stock: 0,
        unidad: "serv",
        marca: "HAITECH",
        categoria: "Servicios",
        tipo: "servicio",
        moneda: "PEN",
        source_system: "soporte.haitech",
        source_id: String(row.id),
        external_updated_at: row.updated_at ?? null,
        activo: true,
      },
    });
    if (!error) count += 1;
  }

  return count;
}

async function pushClientToSoporte(
  admin: SupabaseClient,
  soporteUrl: string,
  soporteKey: string,
  userId: string,
  row: Record<string, unknown>,
): Promise<boolean> {
  const localUpdated = String(row.updated_at ?? "");
  const externalUpdated = String(row.external_updated_at ?? "");
  if (externalUpdated && localUpdated && externalUpdated > localUpdated) {
    return false;
  }

  const payload = {
    nombre: row.razon_social,
    ruc_dni: row.ruc ?? null,
    email: row.correo ?? row.email ?? null,
    telefono: row.telefono ?? null,
    direccion: row.direccion ?? null,
    ciudad: row.ciudad ?? null,
    distrito: row.distrito ?? null,
    tipo_cliente: mapTipoClienteToSoporte(String(row.tipo_cliente ?? "")),
    pipeline_stage: mapEstadoToPipeline(String(row.estado_comercial ?? "")),
    notas: row.observaciones ?? row.notas ?? null,
    nombre_contacto: row.contacto_nombre ?? row.razon_social,
    haistore_source: "haisales",
    updated_at: new Date().toISOString(),
  };

  const sourceId = row.source_id ? String(row.source_id) : null;
  const sourceSystem = String(row.source_system ?? "");

  try {
    if (sourceSystem === "soporte.haitech" && sourceId) {
      await restFetch(
        soporteUrl,
        soporteKey,
        `/rest/v1/clients?id=eq.${encodeURIComponent(sourceId)}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
    } else if (row.ruc) {
      const existing = await restFetch<SoporteClient[]>(
        soporteUrl,
        soporteKey,
        `/rest/v1/clients?select=id&ruc_dni=eq.${encodeURIComponent(String(row.ruc))}&limit=1`,
      );
      if (existing?.[0]?.id) {
        await restFetch(
          soporteUrl,
          soporteKey,
          `/rest/v1/clients?id=eq.${encodeURIComponent(existing[0].id)}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        await admin
          .from("clientes")
          .update({
            source_system: "soporte.haitech",
            source_id: existing[0].id,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId);
      } else {
        const created = await restFetch<SoporteClient[]>(
          soporteUrl,
          soporteKey,
          "/rest/v1/clients",
          {
            method: "POST",
            body: JSON.stringify({ ...payload, haistore_source: "haisales" }),
            headers: { Prefer: "return=representation" },
          },
        );
        const newId = created?.[0]?.id;
        if (newId) {
          await admin
            .from("clientes")
            .update({
              source_system: "soporte.haitech",
              source_id: newId,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .eq("user_id", userId);
        }
      }
    } else {
      return false;
    }

    await admin
      .from("clientes")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", userId);
    return true;
  } catch (error) {
    console.error("[haitech-sync] push client:", error);
    return false;
  }
}

async function pushProductToStore(
  admin: SupabaseClient,
  storeUrl: string,
  storeKey: string,
  userId: string,
  row: Record<string, unknown>,
  usdRate: number,
): Promise<boolean> {
  const localUpdated = String(row.updated_at ?? "");
  const externalUpdated = String(row.external_updated_at ?? "");
  if (externalUpdated && localUpdated && externalUpdated > localUpdated) {
    return false;
  }

  const precioPen = toNumber(row.precio);
  const precioUsd = precioPen > 0 ? Math.round((precioPen / usdRate) * 100) / 100 : 0;
  const sku = String(row.sku ?? "").trim();
  const sourceId = row.source_id ? String(row.source_id) : null;
  const sourceSystem = String(row.source_system ?? "");

  const payload = {
    name: row.nombre,
    description: row.descripcion ?? row.nombre,
    price: precioUsd,
    currency: "USD",
    brand: row.marca ?? null,
    category: row.categoria ?? null,
    stock: Math.max(0, Math.trunc(toNumber(row.stock))),
    updated_at: new Date().toISOString(),
    inventory_snapshot: {
      code: sku || sourceId,
      name: row.nombre,
      brand: row.marca ?? null,
      stock: Math.max(0, Math.trunc(toNumber(row.stock))),
      prices: { public: precioUsd, pen: precioPen },
      currency: "USD",
    },
  };

  try {
    if (sourceSystem === "haitech.pe" && sourceId) {
      await restFetch(
        storeUrl,
        storeKey,
        `/rest/v1/products?id=eq.${encodeURIComponent(sourceId)}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
    } else if (sku) {
      const existing = await restFetch<StoreProduct[]>(
        storeUrl,
        storeKey,
        `/rest/v1/products?select=id&inventory_snapshot->>code=eq.${encodeURIComponent(sku)}&limit=1`,
      );
      const hit = existing?.[0];
      if (hit?.id) {
        await restFetch(
          storeUrl,
          storeKey,
          `/rest/v1/products?id=eq.${encodeURIComponent(hit.id)}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        await admin
          .from("productos")
          .update({
            source_system: "haitech.pe",
            source_id: hit.id,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId);
      } else {
        const newId = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80) || crypto.randomUUID();
        await restFetch(storeUrl, storeKey, "/rest/v1/products", {
          method: "POST",
          body: JSON.stringify({ ...payload, id: newId }),
          headers: { Prefer: "return=minimal" },
        });
        await admin
          .from("productos")
          .update({
            source_system: "haitech.pe",
            source_id: newId,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId);
      }
    } else {
      return false;
    }

    await admin
      .from("productos")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", userId);
    return true;
  } catch (error) {
    console.error("[haitech-sync] push product:", error);
    return false;
  }
}

async function pushInventoryToSoporte(
  admin: SupabaseClient,
  soporteUrl: string,
  soporteKey: string,
  userId: string,
  row: Record<string, unknown>,
): Promise<boolean> {
  const localUpdated = String(row.updated_at ?? "");
  const externalUpdated = String(row.external_updated_at ?? "");
  if (externalUpdated && localUpdated && externalUpdated > localUpdated) {
    return false;
  }

  const sku = String(row.sku ?? "").trim();
  const sourceId = row.source_id ? String(row.source_id) : null;
  const sourceSystem = String(row.source_system ?? "");
  const precioPen = toNumber(row.precio);
  const stock = Math.max(0, Math.trunc(toNumber(row.stock)));
  const marca = String(row.marca ?? row.marca_modelo ?? "").trim() || null;

  const payload = {
    codigo: sku || null,
    modelo: String(row.marca_modelo ?? row.modelo ?? "").trim() || null,
    marca,
    descripcion: String(row.descripcion ?? row.nombre ?? "").trim() || null,
    tipo_producto: String(row.categoria ?? "").trim() || null,
    precio_corporativo_soles: precioPen > 0 ? precioPen : null,
    stock,
    activo: row.activo !== false,
    updated_at: new Date().toISOString(),
  };

  try {
    if (sourceSystem === "soporte.haitech.inventory" && sourceId) {
      await restFetch(
        soporteUrl,
        soporteKey,
        `/rest/v1/inventory_products?id=eq.${encodeURIComponent(sourceId)}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
    } else if (sku) {
      const existing = await restFetch<SoporteInventory[]>(
        soporteUrl,
        soporteKey,
        `/rest/v1/inventory_products?select=id&codigo=eq.${encodeURIComponent(sku)}&limit=1`,
      );
      const hit = existing?.[0];
      if (hit?.id) {
        await restFetch(
          soporteUrl,
          soporteKey,
          `/rest/v1/inventory_products?id=eq.${encodeURIComponent(hit.id)}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        await admin
          .from("productos")
          .update({
            source_system: "soporte.haitech.inventory",
            source_id: hit.id,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId);
      } else {
        const created = await restFetch<SoporteInventory[]>(
          soporteUrl,
          soporteKey,
          "/rest/v1/inventory_products",
          {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { Prefer: "return=representation" },
          },
        );
        const newId = created?.[0]?.id;
        if (newId) {
          await admin
            .from("productos")
            .update({
              source_system: "soporte.haitech.inventory",
              source_id: newId,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .eq("user_id", userId);
        }
      }
    } else {
      return false;
    }

    await admin
      .from("productos")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", userId);
    return true;
  } catch (error) {
    console.error("[haitech-sync] push inventory:", error);
    return false;
  }
}

async function pushServiceToSoporte(
  admin: SupabaseClient,
  soporteUrl: string,
  soporteKey: string,
  userId: string,
  row: Record<string, unknown>,
): Promise<boolean> {
  const localUpdated = String(row.updated_at ?? "");
  const externalUpdated = String(row.external_updated_at ?? "");
  if (externalUpdated && localUpdated && externalUpdated > localUpdated) {
    return false;
  }

  const sourceId = row.source_id ? String(row.source_id) : null;
  const sourceSystem = String(row.source_system ?? "");
  const parsed = parseServiceFields(row);
  const precio = Math.max(0, toNumber(row.precio));

  const payload = {
    equipment_type: parsed.equipment_type,
    service_type: parsed.service_type,
    client_type: parsed.client_type || null,
    price: precio,
    description: String(row.descripcion ?? row.nombre ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  try {
    if (sourceSystem === "soporte.haitech" && sourceId) {
      await restFetch(
        soporteUrl,
        soporteKey,
        `/rest/v1/service_prices?id=eq.${encodeURIComponent(sourceId)}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
    } else {
      const filters = [
        `equipment_type=eq.${encodeURIComponent(parsed.equipment_type)}`,
        `service_type=eq.${encodeURIComponent(parsed.service_type)}`,
      ];
      if (parsed.client_type) {
        filters.push(`client_type=eq.${encodeURIComponent(parsed.client_type)}`);
      }
      const existing = await restFetch<SoporteService[]>(
        soporteUrl,
        soporteKey,
        `/rest/v1/service_prices?select=id&${filters.join("&")}&limit=1`,
      );
      const hit = existing?.[0];
      if (hit?.id) {
        await restFetch(
          soporteUrl,
          soporteKey,
          `/rest/v1/service_prices?id=eq.${encodeURIComponent(hit.id)}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        await admin
          .from("productos")
          .update({
            source_system: "soporte.haitech",
            source_id: hit.id,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("user_id", userId);
      } else {
        const created = await restFetch<SoporteService[]>(
          soporteUrl,
          soporteKey,
          "/rest/v1/service_prices",
          {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { Prefer: "return=representation" },
          },
        );
        const newId = created?.[0]?.id;
        if (newId) {
          await admin
            .from("productos")
            .update({
              source_system: "soporte.haitech",
              source_id: newId,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .eq("user_id", userId);
        }
      }
    }

    await admin
      .from("productos")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", userId);
    return true;
  } catch (error) {
    console.error("[haitech-sync] push service:", error);
    return false;
  }
}

async function pushChanges(
  admin: SupabaseClient,
  userId: string,
  storeUrl: string,
  storeKey: string,
  soporteUrl: string,
  soporteKey: string,
  usdRate: number,
  since: string | null,
  entityType?: string,
  entityId?: string,
): Promise<SyncCounts & { errors: string[] }> {
  const errors: string[] = [];
  const counts = emptyCounts();

  let clientQuery = admin
    .from("clientes")
    .select("*")
    .eq("user_id", userId);

  if (entityType === "cliente" && entityId) {
    clientQuery = clientQuery.eq("id", entityId);
  } else if (since) {
    clientQuery = clientQuery.gte("updated_at", since);
  } else {
    clientQuery = clientQuery.is("last_synced_at", null);
  }

  const { data: clientRows, error: clientErr } = await clientQuery.limit(entityId ? 1 : 500);
  if (clientErr) errors.push(`clientes: ${clientErr.message}`);
  else {
    for (const row of clientRows ?? []) {
      const ok = await pushClientToSoporte(admin, soporteUrl, soporteKey, userId, row);
      if (ok) counts.clients += 1;
    }
  }

  let productQuery = admin
    .from("productos")
    .select("*")
    .eq("user_id", userId);

  if (entityType === "producto" && entityId) {
    productQuery = productQuery.eq("id", entityId);
  } else if (since) {
    productQuery = productQuery.gte("updated_at", since);
  } else {
    productQuery = productQuery.is("last_synced_at", null);
  }

  const { data: productRows, error: productErr } = await productQuery.limit(entityId ? 1 : 500);
  if (productErr) errors.push(`productos: ${productErr.message}`);
  else {
    for (const row of productRows ?? []) {
      const sourceSystem = String(row.source_system ?? "");

      if (isServiceProduct(row)) {
        const ok = await pushServiceToSoporte(admin, soporteUrl, soporteKey, userId, row);
        if (ok) {
          counts.soporteServices += 1;
          counts.products += 1;
        }
        continue;
      }

      if (sourceSystem === "haitech.pe") {
        const ok = await pushProductToStore(admin, storeUrl, storeKey, userId, row, usdRate);
        if (ok) {
          counts.storeProducts += 1;
          counts.products += 1;
        }
        continue;
      }

      if (sourceSystem === "soporte.haitech.inventory") {
        const ok = await pushInventoryToSoporte(admin, soporteUrl, soporteKey, userId, row);
        if (ok) {
          counts.soporteInventory += 1;
          counts.products += 1;
        }
        continue;
      }

      const invOk = await pushInventoryToSoporte(admin, soporteUrl, soporteKey, userId, row);
      const storeOk = await pushProductToStore(admin, storeUrl, storeKey, userId, row, usdRate);
      if (invOk) counts.soporteInventory += 1;
      if (storeOk) counts.storeProducts += 1;
      if (invOk || storeOk) counts.products += 1;
    }
  }

  return { ...counts, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = env("SUPABASE_ANON_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return jsonResponse({ error: "Sesión inválida" }, 401);
    }

    const userId = authData.user.id;
    const admin = createClient(supabaseUrl, serviceRole);
    const body = (await req.json().catch(() => ({}))) as SyncBody;
    const mode: SyncMode = body.mode ?? "full";

    const storeUrl = envOptional("HAITECH_STORE_SUPABASE_URL", "https://onxmvzfdtiattwporeor.supabase.co");
    const storeKey = envOptional(
      "HAITECH_STORE_SERVICE_ROLE_KEY",
      envOptional("HAITECH_STORE_SUPABASE_KEY", ""),
    );
    const soporteUrl = envOptional("HAITECH_SOPORTE_SUPABASE_URL", "https://auhvnkckmaesyiaaculz.supabase.co");
    const soporteKey = envOptional(
      "HAITECH_SOPORTE_SERVICE_ROLE_KEY",
      envOptional("HAITECH_SOPORTE_SUPABASE_KEY", ""),
    );
    const usdRate = Number(envOptional("HAITECH_USD_TO_PEN", "3.75")) || 3.75;

    if (!storeKey || !soporteKey) {
      return jsonResponse({
        error: "Configura HAITECH_STORE_SERVICE_ROLE_KEY y HAITECH_SOPORTE_SERVICE_ROLE_KEY en Edge Functions",
      }, 503);
    }

    const { data: connection } = await admin
      .from("inbox_channel_connections")
      .select("id, last_sync_at, config")
      .eq("user_id", userId)
      .eq("channel", "haitech_store")
      .maybeSingle();

    const since = connection?.last_sync_at ?? null;
    const summary: SyncSummary = {
      ok: true,
      mode,
      pulled: emptyCounts(),
      pushed: emptyCounts(),
      errors: [],
    };

    if (mode === "full" || mode === "pull") {
      try {
        summary.pulled.storeProducts = await pullStoreProducts(
          admin,
          userId,
          storeUrl,
          storeKey,
          usdRate,
          body.entityId ? null : since,
        );
      } catch (error) {
        summary.errors.push(`pull store products: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        summary.pulled.soporteInventory = await pullSoporteInventory(
          admin,
          userId,
          soporteUrl,
          soporteKey,
          usdRate,
          body.entityId ? null : since,
        );
      } catch (error) {
        summary.errors.push(`pull soporte inventory: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        summary.pulled.soporteServices = await pullSoporteServices(
          admin,
          userId,
          soporteUrl,
          soporteKey,
          body.entityId ? null : since,
        );
      } catch (error) {
        summary.errors.push(`pull soporte services: ${error instanceof Error ? error.message : String(error)}`);
      }

      summary.pulled.products =
        summary.pulled.storeProducts +
        summary.pulled.soporteInventory +
        summary.pulled.soporteServices;

      try {
        summary.pulled.clients = await pullSoporteClients(
          admin,
          userId,
          soporteUrl,
          soporteKey,
          body.entityId ? null : since,
        );
      } catch (error) {
        summary.errors.push(`pull clients: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (mode === "full" || mode === "push") {
      const pushResult = await pushChanges(
        admin,
        userId,
        storeUrl,
        storeKey,
        soporteUrl,
        soporteKey,
        usdRate,
        since,
        body.entityType,
        body.entityId,
      );
      summary.pushed = {
        clients: pushResult.clients,
        storeProducts: pushResult.storeProducts,
        soporteInventory: pushResult.soporteInventory,
        soporteServices: pushResult.soporteServices,
        products: pushResult.products,
      };
      summary.errors.push(...pushResult.errors);
    }

    summary.ok = summary.errors.length === 0;

    const now = new Date().toISOString();
    const connectionPayload = {
      status: summary.ok ? "connected" : "error",
      error_message: summary.errors.length ? summary.errors.slice(0, 3).join(" · ") : null,
      last_sync_at: now,
      config: {
        store_url: storeUrl,
        soporte_url: soporteUrl,
        last_pull: summary.pulled,
        last_push: summary.pushed,
      },
    };

    await admin.from("inbox_channel_connections").upsert(
      {
        user_id: userId,
        channel: "haitech_store",
        display_name: "HaiStore + HaiSupport",
        external_account_id: "haitech.pe",
        ...connectionPayload,
      },
      { onConflict: "user_id,channel,external_account_id" },
    );

    await admin.from("inbox_channel_connections").upsert(
      {
        user_id: userId,
        channel: "haitech_soporte",
        display_name: "HaiSupport (soporte.haitech.pe)",
        external_account_id: "soporte.haitech.pe",
        ...connectionPayload,
      },
      { onConflict: "user_id,channel,external_account_id" },
    );

    await admin.from("haitech_sync_log").insert({
      user_id: userId,
      direction: mode === "push" ? "push" : "pull",
      entity_type: "batch",
      status: summary.ok ? "ok" : "error",
      detail: JSON.stringify(summary),
    });

    return jsonResponse(summary);
  } catch (error) {
    console.error("[haitech-sync]", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Error interno" },
      500,
    );
  }
});
