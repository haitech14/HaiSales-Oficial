import { useState } from "react";
import { KeyRound, Plug, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncZavuConnection } from "@/lib/inbox/zavu-connection-service";
import type { IntegracionItem } from "@/lib/integraciones-mock-data";
import { cn } from "@/lib/utils";

export function ConectarIntegracionModal({
  integracion,
  open,
  onOpenChange,
  onConnected,
}: {
  integracion: IntegracionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setApiKey("");
    setApiSecret("");
  };

  const handleConnect = async () => {
    if (!integracion) return;

    if (integracion.id === "zavu") {
      setIsConnecting(true);
      try {
        const result = await syncZavuConnection();
        const label = [result.teamName, result.projectName].filter(Boolean).join(" · ");
        const synced = result.conversationsSynced ?? 0;
        toast.success(
          label
            ? `Zavu conectado (${label}${result.isTestMode ? " · test" : ""}${synced ? ` · ${synced} conversaciones` : ""})`
            : "Zavu conectado correctamente",
        );
        onConnected?.();
        handleClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo conectar Zavu");
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Ingresa la API Key o token de acceso");
      return;
    }
    toast.success(`${integracion.nombre} conectada correctamente`);
    handleClose();
  };

  if (!integracion) return null;

  const Icon = integracion.icon;
  const isZavu = integracion.id === "zavu";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  integracion.iconBg,
                )}
              >
                <Icon className={cn("h-5 w-5", integracion.iconColor)} />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {integracion.estado === "Conectado" ? "Reconfigurar" : "Conectar"}{" "}
                  {integracion.nombre.split("—")[0].trim()}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  {isZavu
                    ? "Usa la API key de Zavu ya configurada en el servidor (ZAVUDEV_API_KEY)."
                    : "Ingresa las credenciales de API para sincronizar datos con HaiSales."}
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {!isZavu && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  API Key / Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="Ingresa tu API Key"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  API Secret / Client ID
                </label>
                <div className="relative">
                  <Plug className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(event) => setApiSecret(event.target.value)}
                    placeholder="Opcional según el proveedor"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl bg-blue-50/70 px-4 py-3 text-xs text-slate-600">
            {isZavu
              ? "La clave se guarda solo en secrets de Supabase (nunca en el frontend)."
              : `Las credenciales se almacenan cifradas. HaiSales solo solicita los permisos necesarios para ${integracion.categoria.toLowerCase()}.`}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isConnecting}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-500"
            disabled={isConnecting}
            onClick={() => void handleConnect()}
          >
            {isConnecting
              ? "Conectando..."
              : integracion.estado === "Conectado"
                ? "Sincronizar"
                : "Conectar integración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
