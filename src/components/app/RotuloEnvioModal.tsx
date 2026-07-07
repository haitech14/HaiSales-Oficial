import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildRotuloEnvioData, buildRotuloPlainText, buildEnvioWhatsAppFromGuia } from "@/lib/logistica/rotulo-utils";
import { fetchPedidoLinesForGuia } from "@/lib/logistica/guias-service";
import type { GuiaRemision } from "@/lib/logistica/types";
import { copyTextToClipboard, withTimeout } from "@/lib/clipboard";
import {
  configToRotuloRemitente,
  defaultRotuloRemitente,
  downloadRotuloEnvioPdf,
  generateRotuloEnvioBlob,
  type RotuloPdfFormat,
} from "@/lib/pdf/generate-rotulo-envio-pdf";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FORMAT_OPTIONS: { id: RotuloPdfFormat; label: string; hint: string }[] = [
  { id: "a4", label: "A4", hint: "Horizontal" },
  { id: "a5", label: "A5", hint: "Horizontal" },
  { id: "ticket", label: "Ticket", hint: "80 mm vertical" },
];

type RotuloEnvioModalProps = {
  guia: GuiaRemision | null;
  open: boolean;
  userId?: string;
  onOpenChange: (open: boolean) => void;
};

export function RotuloEnvioModal({ guia, open, userId, onOpenChange }: RotuloEnvioModalProps) {
  const { data: empresaConfig } = useEmpresaConfig();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [pdfFormat, setPdfFormat] = useState<RotuloPdfFormat>("a4");

  const rotuloData = useMemo(
    () => (guia ? buildRotuloEnvioData(guia) : null),
    [guia],
  );

  const remitente = useMemo(() => {
    if (!empresaConfig) return defaultRotuloRemitente();
    return configToRotuloRemitente(empresaConfig);
  }, [empresaConfig]);

  const pdfInput = useMemo(() => {
    if (!rotuloData) return null;
    return { data: rotuloData, remitente, format: pdfFormat };
  }, [pdfFormat, remitente, rotuloData]);

  useEffect(() => {
    if (!open || !pdfInput) {
      setPdfUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const blob = await generateRotuloEnvioBlob(pdfInput);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch {
        if (active) toast.error("No se pudo generar el rótulo PDF");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadPdf();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, pdfInput]);

  const handleClose = () => {
    onOpenChange(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const handleCopy = async () => {
    if (!guia) return;
    setIsCopying(true);
    try {
      const rotuloData = buildRotuloEnvioData(guia);
      let text = buildRotuloPlainText(rotuloData);

      if (userId) {
        const pedidoLines = await withTimeout(fetchPedidoLinesForGuia(userId, guia), 2500, []);
        text = buildEnvioWhatsAppFromGuia(guia, pedidoLines);
      }

      await copyTextToClipboard(text);
      toast.success("Datos de envío copiados al portapapeles");
    } catch {
      toast.error("No se pudo copiar los datos de envío");
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfInput) return;
    try {
      await downloadRotuloEnvioPdf(pdfInput);
      toast.success(`Rótulo ${pdfFormat.toUpperCase()} descargado`);
    } catch {
      toast.error("No se pudo descargar el rótulo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[95vh] max-w-[920px] gap-0 overflow-hidden border-slate-200 p-0 sm:rounded-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Rótulo de envío
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-500">
                {guia
                  ? `${guia.codigoGuia} · ${guia.destinatario}`
                  : "Datos del destinatario para envío"}
              </DialogDescription>
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

        <div className="grid gap-4 px-6 py-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Remitente (Setup)
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {remitente.nombreComercial || remitente.razonSocial}
              </p>
              <p className="text-xs text-slate-500">RUC {remitente.ruc}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{remitente.direccion}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Destinatario
              </p>
              <p className="mt-1 font-semibold text-slate-800">{guia?.destinatario}</p>
              <p className="text-xs text-slate-500">RUC {guia?.ruc}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Contacto
              </p>
              <p className="mt-1 text-slate-700">{guia?.contacto}</p>
              {guia?.dni && guia.dni !== "—" && (
                <p className="text-xs text-slate-500">DNI {guia.dni}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Teléfono
              </p>
              <p className="mt-1 text-slate-700">{guia?.telefono}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Dirección
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {guia?.direccionDestino}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 justify-start gap-2 border-slate-200"
                onClick={() => void handleCopy()}
                disabled={isCopying}
              >
                {isCopying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copiar datos
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 justify-start gap-2 bg-blue-600 hover:bg-blue-500"
                onClick={() => void handleDownload()}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPdfFormat(option.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition",
                    pdfFormat === option.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-[11px] opacity-80">{option.hint}</span>
                </button>
              ))}
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-xl border border-slate-200 bg-slate-100",
                pdfFormat === "ticket" && "flex justify-center bg-slate-200/80 p-3",
              )}
            >
              {isLoading ? (
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 text-sm text-slate-500",
                    pdfFormat === "ticket" ? "h-[520px] w-[302px] bg-white" : "h-[520px] w-full",
                  )}
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando vista previa PDF...
                </div>
              ) : pdfUrl ? (
                <iframe
                  title={`Rótulo ${guia?.codigoGuia ?? ""}`}
                  src={pdfUrl}
                  className={cn(
                    "bg-white",
                    pdfFormat === "ticket"
                      ? "h-[520px] w-[302px] max-w-full border border-slate-300 shadow-sm"
                      : "h-[520px] w-full",
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center text-sm text-slate-500",
                    pdfFormat === "ticket" ? "h-[520px] w-[302px] bg-white" : "h-[520px] w-full",
                  )}
                >
                  No hay vista previa disponible
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 border-slate-200 bg-white text-slate-700"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
