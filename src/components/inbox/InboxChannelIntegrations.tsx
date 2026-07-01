import { inboxChannelMeta, INBOX_CHANNEL_ORDER } from "@/lib/inbox/channels";
import type { ChannelConnection } from "@/lib/inbox/types";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: ChannelConnection[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Integraciones del Inbox</SheetTitle>
          <SheetDescription>
            Conecta las APIs de cada canal para sincronizar conversaciones en tiempo real.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {INBOX_CHANNEL_ORDER.map((channel) => {
            const meta = inboxChannelMeta[channel];
            const connection = connections.find((item) => item.channel === channel);
            const isConnected = connection?.status === "connected";

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
                    <p className="mt-1 text-xs text-slate-500">Webhook: {meta.webhookPath}</p>
                    <ul className="mt-2 space-y-1">
                      {meta.apiEnvKeys.map((envKey) => (
                        <li key={envKey} className="font-mono text-xs text-slate-400">
                          {envKey}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" className="mt-3 h-8 text-xs">
                      {isConnected ? "Reconfigurar API" : "Conectar API"}
                    </Button>
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
