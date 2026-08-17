import { useState } from "react";
import { RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { inboxChannelMeta, INBOX_CHANNEL_ORDER } from "@/lib/inbox/channels";
import { MESSAGING_PROVIDERS } from "@/lib/inbox/messaging-providers";
import type { ChannelConnection } from "@/lib/inbox/types";
import { syncZavuConnection } from "@/lib/inbox/zavu-connection-service";
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
  const zavuConnected = connections.some(
    (item) => item.channel === "zavu" && item.status === "connected",
  );
  const whatsAppConnected =
    MESSAGING_PROVIDERS.zavu &&
    (zavuConnected || whatsappConnections.some((item) => item.status === "connected"));

  const handleSyncZavu = async () => {
    if (!userId) {
      toast.error("Inicia sesión para sincronizar Zavu");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncZavuConnection();
      const label = [result.teamName, result.projectName].filter(Boolean).join(" · ");
      const synced = result.conversationsSynced ?? 0;
      toast.success(
        label
          ? `Zavu sincronizado (${label}${synced ? ` · ${synced} conversaciones` : ""})`
          : "Zavu sincronizado correctamente",
      );
      onConnectionsChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo sincronizar Zavu");
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
            Mensajería activa vía Zavu (WhatsApp, Facebook e Instagram). Kapso está desactivado
            temporalmente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {INBOX_CHANNEL_ORDER.map((channel) => {
            const meta = inboxChannelMeta[channel];
            const connection = connections.find((item) => item.channel === channel);
            const isConnected =
              channel === "whatsapp"
                ? whatsAppConnected
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

                    {channel === "whatsapp" && MESSAGING_PROVIDERS.zavu ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isSyncing}
                          onClick={() => void handleSyncZavu()}
                        >
                          <RefreshCw
                            className={cn("mr-1.5 h-3.5 w-3.5", isSyncing && "animate-spin")}
                          />
                          {isSyncing ? "Sincronizando..." : "Sincronizar Zavu"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isSyncing}
                          onClick={() => void handleSyncZavu()}
                        >
                          <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                          {whatsAppConnected ? "Reconectar Zavu" : "Conectar Zavu"}
                        </Button>
                      </div>
                    ) : channel === "whatsapp" && !MESSAGING_PROVIDERS.zavu ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No hay proveedor de WhatsApp activo.
                      </p>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" disabled>
                        {isConnected ? "Vía Zavu" : "Requiere Zavu"}
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
