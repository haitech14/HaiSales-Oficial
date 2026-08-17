/** Proveedores de mensajería activos. Kapso desactivado temporalmente. */
export const MESSAGING_PROVIDERS = {
  zavu: true,
  zernio: false,
  kapso: false,
} as const;

export type MessagingProvider = keyof typeof MESSAGING_PROVIDERS;

export function isMessagingProviderEnabled(provider: string | undefined | null): boolean {
  if (!provider) return false;
  if (provider in MESSAGING_PROVIDERS) {
    return MESSAGING_PROVIDERS[provider as MessagingProvider];
  }
  return false;
}

export function inferProviderFromExternalId(externalId: string): MessagingProvider | null {
  if (externalId.startsWith("zavu:")) return "zavu";
  if (externalId.startsWith("zernio:")) return "zernio";
  if (externalId.startsWith("kapso:")) return "kapso";
  return null;
}

export function canSendConversation(provider: string | undefined, channel: string): boolean {
  if (!isMessagingProviderEnabled(provider)) return false;
  if (provider === "zavu") {
    return channel === "whatsapp" || channel === "facebook" || channel === "instagram" || channel === "messenger";
  }
  if (provider === "kapso") return channel === "whatsapp";
  return false;
}
