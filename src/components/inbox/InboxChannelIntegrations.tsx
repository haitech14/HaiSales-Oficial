import { useState } from "react";

import { RefreshCw, Smartphone } from "lucide-react";

import { toast } from "sonner";

import { inboxChannelMeta, INBOX_CHANNEL_ORDER } from "@/lib/inbox/channels";

import type { ChannelConnection } from "@/lib/inbox/types";

import { getWhatsAppWebhookUrl } from "@/lib/inbox/whatsapp-webhook-config";

import {

  activateWhatsAppWebhook,

  deactivateWhatsAppWebhook,

  syncKapsoWhatsAppNumbers,

} from "@/lib/inbox/whatsapp-connection-service";

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

  const [isActivatingApi, setIsActivatingApi] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  const whatsAppWebhookUrl = getWhatsAppWebhookUrl();

  const whatsAppConnected = whatsappConnections.some((item) => item.status === "connected");



  const handleSyncKapso = async () => {

    if (!userId) {

      toast.error("Inicia sesión para sincronizar Kapso");

      return;

    }



    setIsSyncing(true);

    try {

      const result = await syncKapsoWhatsAppNumbers();

      toast.success(`Kapso sincronizado · ${result.connections.length} número(s)`);

      onConnectionsChange?.();

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "No se pudo sincronizar Kapso");

    } finally {

      setIsSyncing(false);

    }

  };



  const handleWhatsAppApi = async (isConnected: boolean) => {

    if (!userId) {

      toast.error("Inicia sesión para conectar WhatsApp API");

      return;

    }



    setIsActivatingApi(true);

    try {

      if (isConnected) {

        await deactivateWhatsAppWebhook(userId);

        toast.success("WhatsApp Kapso desconectado");

      } else {

        const activation = await activateWhatsAppWebhook(userId);

        toast.success("WhatsApp Kapso conectado", {

          description: `${activation.connections.length} número(s) · ${activation.webhookUrl}`,

        });

      }

      onConnectionsChange?.();

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "No se pudo actualizar WhatsApp API");

    } finally {

      setIsActivatingApi(false);

    }

  };



  return (

    <Sheet open={open} onOpenChange={onOpenChange}>

      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">

        <SheetHeader>

          <SheetTitle>Integraciones del Inbox</SheetTitle>

          <SheetDescription>

            Conecta Kapso para sincronizar números WhatsApp, recibir y enviar mensajes.

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

            const webhookPath = channel === "whatsapp" ? whatsAppWebhookUrl : meta.webhookPath;



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

                    <p className="mt-1 break-all text-xs text-slate-500">Webhook: {webhookPath}</p>



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



                    {channel === "whatsapp" ? (

                      <div className="mt-3 flex flex-wrap gap-2">

                        <Button

                          variant="outline"

                          size="sm"

                          className="h-8 text-xs"

                          disabled={isSyncing}

                          onClick={() => void handleSyncKapso()}

                        >

                          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isSyncing && "animate-spin")} />

                          {isSyncing ? "Sincronizando..." : "Sincronizar Kapso"}

                        </Button>

                        <Button

                          variant="outline"

                          size="sm"

                          className="h-8 text-xs"

                          disabled={isActivatingApi}

                          onClick={() => void handleWhatsAppApi(whatsAppConnected)}

                        >

                          <Smartphone className="mr-1.5 h-3.5 w-3.5" />

                          {isActivatingApi

                            ? "Procesando..."

                            : whatsAppConnected

                              ? "Desconectar Kapso"

                              : "Conectar Kapso"}

                        </Button>

                      </div>

                    ) : (

                      <Button variant="outline" size="sm" className="mt-3 h-8 text-xs">

                        {isConnected ? "Reconfigurar API" : "Conectar API"}

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


