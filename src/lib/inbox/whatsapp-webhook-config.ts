import { getSupabaseUrl } from "@/lib/supabase-env";

const DEFAULT_VERIFY_TOKEN = "f32ede06e17ff2b8d7e9a5e874bf78c3ba4a301fd909c9a69e5e9a80d3b6e958";

export const DEFAULT_WHATSAPP_PHONE_NUMBER_ID = "597907523413541";

export function getWhatsAppWebhookVerifyToken(): string {
  return import.meta.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || DEFAULT_VERIFY_TOKEN;
}

export function getWhatsAppWebhookUrl(): string {
  const projectUrl = getSupabaseUrl().replace(/\/$/, "");
  if (!projectUrl) return "/functions/v1/whatsapp-webhook";
  return `${projectUrl}/functions/v1/whatsapp-webhook`;
}

export function getWhatsAppPhoneNumberId(): string {
  const value = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID?.trim();
  return value || DEFAULT_WHATSAPP_PHONE_NUMBER_ID;
}
