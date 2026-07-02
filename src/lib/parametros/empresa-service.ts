import { supabase } from "@/integrations/supabase/client";

export type EmpresaConfig = {
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  moneda: string;
  igvPorcentaje: number;
  serieFactura: string;
  serieBoleta: string;
};

export const defaultEmpresaConfig: EmpresaConfig = {
  razonSocial: "",
  ruc: "",
  direccion: "",
  telefono: "",
  email: "",
  moneda: "PEN",
  igvPorcentaje: 18,
  serieFactura: "F001",
  serieBoleta: "B001",
};

type EmpresaRow = {
  user_id: string;
  razon_social: string | null;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  igv_porcentaje: number;
  serie_factura: string | null;
  serie_boleta: string | null;
};

function mapRowToConfig(row: EmpresaRow): EmpresaConfig {
  return {
    razonSocial: row.razon_social ?? "",
    ruc: row.ruc ?? "",
    direccion: row.direccion ?? "",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    moneda: row.moneda ?? "PEN",
    igvPorcentaje: Number(row.igv_porcentaje ?? 18),
    serieFactura: row.serie_factura ?? "F001",
    serieBoleta: row.serie_boleta ?? "B001",
  };
}

export async function fetchEmpresaConfig(userId: string): Promise<EmpresaConfig> {
  const { data, error } = await supabase
    .from("empresa_config" as "profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return mapRowToConfig(data as unknown as EmpresaRow);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, ruc, phone, direccion, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) {
    return {
      ...defaultEmpresaConfig,
      razonSocial: profile.company_name ?? "",
      ruc: profile.ruc ?? "",
      telefono: profile.phone ?? "",
      direccion: (profile as { direccion?: string }).direccion ?? "",
      email: (profile as { email?: string }).email ?? "",
    };
  }

  return defaultEmpresaConfig;
}

export async function updateEmpresaConfig(userId: string, config: EmpresaConfig) {
  const payload = {
    user_id: userId,
    razon_social: config.razonSocial.trim() || null,
    ruc: config.ruc.trim() || null,
    direccion: config.direccion.trim() || null,
    telefono: config.telefono.trim() || null,
    email: config.email.trim() || null,
    moneda: config.moneda,
    igv_porcentaje: config.igvPorcentaje,
    serie_factura: config.serieFactura.trim() || null,
    serie_boleta: config.serieBoleta.trim() || null,
  };

  const { data, error } = await supabase
    .from("empresa_config" as "profiles")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("profiles")
    .update({
      company_name: config.razonSocial.trim() || null,
      ruc: config.ruc.trim() || null,
      phone: config.telefono.trim() || null,
      direccion: config.direccion.trim() || null,
      email: config.email.trim() || null,
    } as never)
    .eq("user_id", userId);

  return mapRowToConfig(data as unknown as EmpresaRow);
}
