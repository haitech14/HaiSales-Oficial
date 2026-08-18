/** Proveedores de mensajería activos. Kapso desactivado temporalmente. */
export const MESSAGING_PROVIDERS = {
  zavu: false,
  zernio: true,
  kapso: false,
} as const;

export type MessagingProvider = keyof typeof MESSAGING_PROVIDERS;

const LIVE_CHANNELS = new Set(["whatsapp", "facebook", "instagram", "messenger", "zavu", "zernio"]);

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

export function isLiveMessagingChannel(channel: string): boolean {
  return LIVE_CHANNELS.has(channel);
}

export function activeMessagingProviderLabel(): string {
  if (MESSAGING_PROVIDERS.zernio) return "Zernio";
  if (MESSAGING_PROVIDERS.zavu) return "Zavu";
  if (MESSAGING_PROVIDERS.kapso) return "Kapso";
  return "mensajería";
}

export function hasLiveMessagingConnection(
  connections: Array<{ channel: string; status: string }>,
): boolean {
  return connections.some((item) => item.status === "connected" && isLiveMessagingChannel(item.channel));
}

export function canSendConversation(
  provider: string | undefined,
  channel: string,
  externalId?: string,
): boolean {
  const resolved = provider || inferProviderFromExternalId(externalId ?? "") || undefined;
  if (!resolved) {
    return (MESSAGING_PROVIDERS.zernio || MESSAGING_PROVIDERS.zavu) && isLiveMessagingChannel(channel);
  }
  if (!isMessagingProviderEnabled(resolved)) return false;
  if (resolved === "zavu" || resolved === "zernio") {
    return isLiveMessagingChannel(channel);
  }
  if (resolved === "kapso") return channel === "whatsapp";
  return false;
}
