import { useState } from "react";
import { RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { inboxChannelMeta, INBOX_CHANNEL_ORDER } from "@/lib/inbox/channels";
import {
  activeMessagingProviderLabel,
  hasLiveMessagingConnection,
  MESSAGING_PROVIDERS,
} from "@/lib/inbox/messaging-providers";
import type { ChannelConnection } from "@/lib/inbox/types";
import { syncZavuConnection } from "@/lib/inbox/zavu-connection-service";
import { syncZernioConnection } from "@/lib/inbox/zernio-connection-service";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LIVE_CHANNELS = new Set(["whatsapp", "instagram", "facebook", "messenger"]);

export function InboxChannelIntegrations({
  open,
  onOpenChange,
  connections,
  whatsappConnections,
  userId,
  onConnectionsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: ChannelConnection[];
  whatsappConnections: ChannelConnection[];
  userId?: string;
  onConnectionsChange?: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const providerLabel = activeMessagingProviderLabel();
  const messagingConnected = hasLiveMessagingConnection([...connections, ...whatsappConnections]);
  const canUseZernio = MESSAGING_PROVIDERS.zernio;
  const canUseZavu = MESSAGING_PROVIDERS.zavu;

  const handleSync = async () => {
    if (!userId) {
      toast.error(`Inicia sesión para sincronizar ${providerLabel}`);
      return;
    }

    setIsSyncing(true);
    try {
      if (canUseZernio) {
        const result = await syncZernioConnection();
        toast.success(
          `Zernio sincronizado (${result.accounts} cuentas · ${result.conversationsSynced} conversaciones)`,
        );
      } else if (canUseZavu) {
        const result = await syncZavuConnection();
        const label = [result.teamName, result.projectName].filter(Boolean).join(" · ");
        const synced = result.conversationsSynced ?? 0;
        toast.success(
          label
            ? `Zavu sincronizado (${label}${synced ? ` · ${synced} conversaciones` : ""})`
            : "Zavu sincronizado correctamente",
        );
      }
      onConnectionsChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `No se pudo sincronizar ${providerLabel}`,
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Integraciones del Inbox</SheetTitle>
          <SheetDescription>
            Mensajería activa vía {providerLabel} (WhatsApp, Facebook e Instagram). Kapso está
            desactivado temporalmente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {INBOX_CHANNEL_ORDER.map((channel) => {
            const meta = inboxChannelMeta[channel];
            const connection = connections.find((item) => item.channel === channel);
            const isLiveChannel = LIVE_CHANNELS.has(channel);
            const isConnected =
              channel === "whatsapp"
                ? whatsappConnections.some((item) => item.status === "connected") ||
                  connections.some((item) => item.channel === "whatsapp" && item.status === "connected")
                : connection?.status === "connected";

            return (
              <article
                key={channel}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <ChannelIcon channel={channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="app-panel-title">{meta.label}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          isConnected
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-500",
                        )}
                      >
                        {isConnected ? "Conectado" : "Pendiente"}
                      </Badge>
                    </div>

                    {channel === "whatsapp" && whatsappConnections.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {whatsappConnections.map((item) => (
                          <li key={item.id ?? item.phoneNumberId} className="text-xs text-slate-600">
                            {item.accountLabel ?? item.phoneNumberId}
                            <span className="ml-1 text-slate-400">({item.status})</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {channel === "whatsapp" && (canUseZernio || canUseZavu) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isSyncing}
                          onClick={() => void handleSync()}
                        >
                          <RefreshCw
                            className={cn("mr-1.5 h-3.5 w-3.5", isSyncing && "animate-spin")}
                          />
                          {isSyncing ? "Sincronizando..." : `Sincronizar ${providerLabel}`}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isSyncing}
                          onClick={() => void handleSync()}
                        >
                          <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                          {messagingConnected ? `Reconectar ${providerLabel}` : `Conectar ${providerLabel}`}
                        </Button>
                      </div>
                    ) : channel === "whatsapp" && !canUseZernio && !canUseZavu ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No hay proveedor de WhatsApp activo.
                      </p>
                    ) : isLiveChannel ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 text-xs"
                        disabled={isSyncing}
                        onClick={() => void handleSync()}
                      >
                        {isConnected ? `Vía ${providerLabel}` : `Conectar ${providerLabel}`}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" disabled>
                        Próximamente
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
