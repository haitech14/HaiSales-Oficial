import { useCallback, useEffect, useState } from "react";
import {
  connectWhatsAppWeb,
  disconnectWhatsAppWeb,
  getWhatsAppWebSession,
  type WhatsAppWebSession,
} from "@/lib/inbox/whatsapp-web";

export function useWhatsAppWeb() {
  const [session, setSession] = useState<WhatsAppWebSession>(() => getWhatsAppWebSession());
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "haisales_whatsapp_web") {
        setSession(getWhatsAppWebSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const link = useCallback(async (phoneLabel?: string) => {
    setIsLinking(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
    const next = connectWhatsAppWeb(phoneLabel);
    setSession(next);
    setIsLinking(false);
    return next;
  }, []);

  const unlink = useCallback(() => {
    disconnectWhatsAppWeb();
    setSession({ connected: false });
  }, []);

  return {
    session,
    isConnected: session.connected,
    isLinking,
    link,
    unlink,
  };
}
