const STORAGE_KEY = "haisales_whatsapp_web";

export type WhatsAppWebSession = {
  connected: boolean;
  phoneLabel?: string;
  connectedAt?: string;
};

export function getWhatsAppWebSession(): WhatsAppWebSession {
  if (typeof window === "undefined") return { connected: false };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { connected: false };
    return JSON.parse(raw) as WhatsAppWebSession;
  } catch {
    return { connected: false };
  }
}

export function connectWhatsAppWeb(phoneLabel = "WhatsApp Business"): WhatsAppWebSession {
  const session: WhatsAppWebSession = {
    connected: true,
    phoneLabel,
    connectedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function disconnectWhatsAppWeb(): void {
  localStorage.removeItem(STORAGE_KEY);
}
