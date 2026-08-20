import { supabase } from "@/integrations/supabase/client";

const BUCKET = "listas-precios";

export type ListaPreciosPdf = {
  id: string;
  slot: 1 | 2;
  nombre: string;
  storagePath: string;
  publicUrl: string;
};

type ListaPreciosRow = {
  id: string;
  slot: number;
  nombre: string;
  storage_path: string;
  public_url: string;
};

function mapRow(row: ListaPreciosRow): ListaPreciosPdf {
  return {
    id: row.id,
    slot: row.slot === 2 ? 2 : 1,
    nombre: row.nombre,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
  };
}

export async function fetchListasPrecios(userId: string): Promise<ListaPreciosPdf[]> {
  const { data, error } = await supabase
    .from("whatsapp_listas_precios")
    .select("id, slot, nombre, storage_path, public_url")
    .eq("user_id", userId)
    .order("slot", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ListaPreciosRow[]).map(mapRow);
}

export async function uploadListaPreciosPdf(
  userId: string,
  slot: 1 | 2,
  file: File,
): Promise<ListaPreciosPdf> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Solo se aceptan archivos PDF");
  }

  const safeName = file.name.replace(/[^\w.\-() áéíóúÁÉÍÓÚñÑ]/g, "_");
  const path = `${userId}/lista-${slot}.pdf`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;
  const nombre = safeName || `Lista de precios ${slot}.pdf`;

  const { data, error } = await supabase
    .from("whatsapp_listas_precios")
    .upsert(
      {
        user_id: userId,
        slot,
        nombre,
        storage_path: path,
        public_url: publicUrl,
      } as never,
      { onConflict: "user_id,slot" },
    )
    .select("id, slot, nombre, storage_path, public_url")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se pudo guardar la lista de precios");
  return mapRow(data as ListaPreciosRow);
}

export type WhatsAppOutboundAttachment = {
  url: string;
  name: string;
};

export type SendWhatsAppPlantillaResult = {
  ok: boolean;
  copied: boolean;
  fallbackWaUrl?: string;
  error?: string;
};

export async function sendWhatsAppPlantilla(options: {
  to: string;
  text: string;
  attachments?: WhatsAppOutboundAttachment[];
}): Promise<SendWhatsAppPlantillaResult> {
  const { data, error } = await supabase.functions.invoke("zernio-send", {
    body: {
      to: options.to,
      text: options.text,
      attachments: options.attachments ?? [],
    },
  });

  if (error) {
    return {
      ok: false,
      copied: true,
      error: error.message,
      fallbackWaUrl: typeof data?.fallbackWaUrl === "string" ? data.fallbackWaUrl : undefined,
    };
  }
  if (data?.error) {
    return {
      ok: false,
      copied: true,
      error: String(data.error),
      fallbackWaUrl: typeof data.fallbackWaUrl === "string" ? data.fallbackWaUrl : undefined,
    };
  }

  return {
    ok: true,
    copied: true,
    fallbackWaUrl: typeof data?.fallbackWaUrl === "string" ? data.fallbackWaUrl : undefined,
  };
}

export function whatsAppMeUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
