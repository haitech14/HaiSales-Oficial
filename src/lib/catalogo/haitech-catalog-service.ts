import type { AutocompleteOption } from "@/components/app/SearchableAutocomplete";

const STORE_SUPABASE_URL =
  (import.meta.env.VITE_HAITECH_STORE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://onxmvzfdtiattwporeor.supabase.co";

const STORE_SUPABASE_KEY =
  (import.meta.env.VITE_HAITECH_STORE_SUPABASE_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueG12emZkdGlhdHR3cG9yZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjAzMzcsImV4cCI6MjA5NTU5NjMzN30.Wd2G3Dh3h2uI_auaI7hqqivNUpDvmVVqz2hgIrRjiXk";

const SOPORTE_SUPABASE_URL =
  (import.meta.env.VITE_HAITECH_SOPORTE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://auhvnkckmaesyiaaculz.supabase.co";

const SOPORTE_SUPABASE_KEY =
  (import.meta.env.VITE_HAITECH_SOPORTE_SUPABASE_KEY as string | undefined) ||
  "sb_publishable_TzIaLkudJIiTzIm_YnNLRg_Ko4_KSHZ";

const USD_TO_PEN = Number(import.meta.env.VITE_HAITECH_USD_TO_PEN ?? 3.75) || 3.75;

type StoreProductRow = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  brand?: string | null;
  category?: string | null;
  stock?: number | null;
  is_featured?: boolean | null;
  image_url?: string | null;
  gallery?: string[] | null;
  inventory_snapshot?: {
    code?: string | null;
    name?: string | null;
    brand?: string | null;
    stock?: number | null;
    image_url?: string | null;
    gallery?: string[] | null;
    prices?: Record<string, number> | null;
    currency?: string | null;
  } | null;
  prices?: Record<string, number> | null;
};

type SoporteInventoryRow = {
  id: string;
  codigo?: string | null;
  modelo?: string | null;
  marca?: string | null;
  descripcion?: string | null;
  tipo_producto?: string | null;
  precio_corporativo_soles?: number | string | null;
  precio_corporativo_dolares?: number | string | null;
  stock?: number | null;
  activo?: boolean | null;
  imagen_url?: string | null;
};

type SoporteServicePriceRow = {
  id: string;
  equipment_type?: string | null;
  service_type?: string | null;
  price?: number | null;
  description?: string | null;
  client_type?: string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function pricePair(amount: number, currency?: string | null): { precioPen: number; precioUsd: number } {
  const raw = toNumber(amount);
  const cur = (currency ?? "USD").toUpperCase();
  if (cur === "PEN") {
    return {
      precioPen: roundMoney(raw),
      precioUsd: raw > 0 ? roundMoney(raw / USD_TO_PEN) : 0,
    };
  }
  return {
    precioUsd: roundMoney(raw),
    precioPen: roundMoney(raw * USD_TO_PEN),
  };
}

const IMAGE_CDN_BASE =
  (import.meta.env.VITE_HAITECH_IMAGE_CDN as string | undefined)?.replace(/\/$/, "") ||
  "https://haitech.pe";

export function resolveHaitechImageUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `${IMAGE_CDN_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function firstImageUrl(
  imageUrl?: string | null,
  gallery?: string[] | null,
  snapshot?: StoreProductRow["inventory_snapshot"],
): string | null {
  return (
    resolveHaitechImageUrl(imageUrl) ||
    resolveHaitechImageUrl(snapshot?.image_url) ||
    resolveHaitechImageUrl(gallery?.[0]) ||
    resolveHaitechImageUrl(snapshot?.gallery?.[0])
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function supabaseRest<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
  }

  return (await response.json()) as T;
}

function mapStoreProduct(product: StoreProductRow): AutocompleteOption {
  const code = product.inventory_snapshot?.code?.trim() || product.id;
  const { precioPen, precioUsd } = pricePair(toNumber(product.price), product.currency);
  const brand = product.brand?.trim() || product.inventory_snapshot?.brand?.trim() || "";
  const category = product.category?.trim() || "";
  const stock = product.stock ?? product.inventory_snapshot?.stock ?? null;
  const imageUrl = firstImageUrl(product.image_url, product.gallery, product.inventory_snapshot);

  return {
    value: `store:${product.id}`,
    label: product.name,
    hint: [code, brand, stock != null ? `Stock ${stock}` : null, "Tienda"].filter(Boolean).join(" · "),
    searchText: `${code} ${product.name} ${product.description ?? ""} ${brand} ${category}`,
    meta: {
      codigo: code,
      precio: precioPen,
      precioPen,
      precioUsd,
      unidad: "UND",
      productoId: product.id,
      imageUrl: imageUrl ?? "",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      iconKind: "product",
      source: "haitech.pe",
      currency: "PEN",
      brand,
      category,
      stock: stock ?? "",
    },
  };
}

function mapSoporteInventory(product: SoporteInventoryRow): AutocompleteOption | null {
  const label =
    product.descripcion?.trim() ||
    [product.marca, product.modelo].filter(Boolean).join(" ").trim() ||
    product.codigo?.trim();
  if (!label) return null;

  const soles = toNumber(product.precio_corporativo_soles);
  const dolares = toNumber(product.precio_corporativo_dolares);
  const precioPen = soles > 0 ? roundMoney(soles) : roundMoney(dolares * USD_TO_PEN);
  const precioUsd =
    dolares > 0 ? roundMoney(dolares) : soles > 0 ? roundMoney(soles / USD_TO_PEN) : 0;
  const code = product.codigo?.trim() || product.modelo?.trim() || product.id;
  const tipo = (product.tipo_producto || "").toLowerCase();
  const isService = tipo.includes("servicio") || tipo.includes("service");
  const stock = product.stock ?? null;
  const imageUrl = resolveHaitechImageUrl(product.imagen_url);

  return {
    value: `soporte:${product.id}`,
    label,
    hint: [code, product.marca?.trim() || null, stock != null ? `Stock ${stock}` : null, "Soporte"]
      .filter(Boolean)
      .join(" · "),
    searchText: `${code} ${label} ${product.marca ?? ""} ${product.modelo ?? ""} ${product.tipo_producto ?? ""}`,
    meta: {
      codigo: code,
      precio: precioPen,
      precioPen,
      precioUsd,
      unidad: "UND",
      productoId: product.id,
      imageUrl: imageUrl ?? "",
      iconBg: isService ? "bg-violet-50" : "bg-emerald-50",
      iconColor: isService ? "text-violet-600" : "text-emerald-600",
      iconKind: isService ? "service" : "product",
      source: "soporte.haitech.pe",
      currency: "PEN",
      brand: product.marca ?? "",
      category: product.tipo_producto ?? "",
      stock: stock ?? "",
    },
  };
}

function mapSoporteService(service: SoporteServicePriceRow): AutocompleteOption {
  const label =
    service.description?.trim() ||
    `Servicio ${service.service_type ?? ""} ${service.equipment_type ?? ""}`.trim();
  const precioPen = roundMoney(toNumber(service.price));
  const precioUsd = precioPen > 0 ? roundMoney(precioPen / USD_TO_PEN) : 0;
  const code = `${service.service_type ?? "srv"}-${service.equipment_type ?? "eq"}`.toUpperCase();

  return {
    value: `service:${service.id}`,
    label,
    hint: [code, service.client_type, "Servicio"].filter(Boolean).join(" · "),
    searchText: `${label} ${service.service_type ?? ""} ${service.equipment_type ?? ""} ${service.client_type ?? ""}`,
    meta: {
      codigo: code,
      precio: precioPen,
      precioPen,
      precioUsd,
      unidad: "UND",
      productoId: service.id,
      imageUrl: "",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      iconKind: "service",
      source: "soporte.haitech.pe",
      currency: "PEN",
      brand: "HAITECH",
      category: "Servicio técnico",
    },
  };
}

async function searchStoreProducts(query: string, limit: number): Promise<AutocompleteOption[]> {
  const trimmed = query.trim();
  let path: string;

  if (trimmed) {
    const pattern = `*${trimmed.replace(/[,()]/g, " ").replace(/\*/g, "")}*`;
    const orFilter = [
      `name.ilike.${pattern}`,
      `description.ilike.${pattern}`,
      `brand.ilike.${pattern}`,
      `category.ilike.${pattern}`,
      `inventory_snapshot->>code.ilike.${pattern}`,
    ].join(",");
    path = `/rest/v1/products?select=id,name,description,price,currency,brand,category,stock,is_featured,image_url,gallery,inventory_snapshot,prices&or=(${encodeURIComponent(orFilter)})&limit=${limit}`;
  } else {
    path = `/rest/v1/products?select=id,name,description,price,currency,brand,category,stock,is_featured,image_url,gallery,inventory_snapshot,prices&order=sort_order.asc&limit=${limit}`;
  }

  const rows = await supabaseRest<StoreProductRow[]>(STORE_SUPABASE_URL, STORE_SUPABASE_KEY, path);
  return rows.map(mapStoreProduct);
}

async function searchSoporteInventory(query: string, limit: number): Promise<AutocompleteOption[]> {
  // La RLS de inventory_products es inestable con filtros; pedimos un lote y filtramos en cliente.
  const rows = await supabaseRest<SoporteInventoryRow[]>(
    SOPORTE_SUPABASE_URL,
    SOPORTE_SUPABASE_KEY,
    `/rest/v1/inventory_products?select=*&limit=20`,
  );

  const options = rows
    .filter((row) => row.activo !== false)
    .map(mapSoporteInventory)
    .filter((option): option is AutocompleteOption => Boolean(option));

  const q = normalize(query);
  if (!q) return options.slice(0, limit);

  return options
    .filter((option) =>
      normalize(`${option.label} ${option.hint ?? ""} ${option.searchText ?? ""}`).includes(q),
    )
    .slice(0, limit);
}

async function searchSoporteServices(query: string, limit: number): Promise<AutocompleteOption[]> {
  const rows = await supabaseRest<SoporteServicePriceRow[]>(
    SOPORTE_SUPABASE_URL,
    SOPORTE_SUPABASE_KEY,
    `/rest/v1/service_prices?select=id,equipment_type,service_type,price,description,client_type&limit=100`,
  );

  const options = rows.map(mapSoporteService);
  const q = normalize(query);
  if (!q) return options.slice(0, limit);

  return options
    .filter((option) =>
      normalize(`${option.label} ${option.hint ?? ""} ${option.searchText ?? ""}`).includes(q),
    )
    .slice(0, limit);
}

function dedupeOptions(options: AutocompleteOption[]): AutocompleteOption[] {
  const seen = new Set<string>();
  const result: AutocompleteOption[] = [];
  for (const option of options) {
    const key = normalize(`${option.meta?.codigo ?? ""}|${option.label}|${option.meta?.source ?? ""}`);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(option);
  }
  return result;
}

/**
 * Busca en los Supabase de haitech.pe (tienda) y soporte.haitech.pe (inventario + servicios).
 */
export async function searchHaitechCatalog(query: string, limit = 24): Promise<AutocompleteOption[]> {
  const trimmed = query.trim();
  const storeLimit = Math.max(8, Math.ceil(limit * 0.7));

  const [storeResult, soporteInventory, soporteServices] = await Promise.all([
    searchStoreProducts(trimmed, storeLimit).catch((error) => {
      console.warn("[catalogo] supabase haitech.pe:", error);
      return [] as AutocompleteOption[];
    }),
    searchSoporteInventory(trimmed, limit).catch((error) => {
      console.warn("[catalogo] supabase soporte inventory:", error);
      return [] as AutocompleteOption[];
    }),
    searchSoporteServices(trimmed, limit).catch((error) => {
      console.warn("[catalogo] supabase soporte services:", error);
      return [] as AutocompleteOption[];
    }),
  ]);

  return dedupeOptions([...storeResult, ...soporteInventory, ...soporteServices]).slice(0, limit);
}
