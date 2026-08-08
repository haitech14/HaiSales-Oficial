import { useState } from "react";
import { CheckCircle2, Copy, FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  calculateCartTotals,
  formatVentaCurrency,
  resolveVentaLineItems,
  type NuevaVentaFormData,
} from "@/lib/nueva-venta-types";
import type { EmpresaEmisor } from "@/lib/parametros/empresa-service";
import {
  buildVentaClienteShareText,
  buildWhatsAppMeLink,
} from "@/lib/ventas/venta-success-share";
import { toast } from "sonner";

type VentaRegistradaSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NuevaVentaFormData | null;
  emisor: EmpresaEmisor;
};

export function VentaRegistradaSuccessDialog({
  open,
  onOpenChange,
  form,
  emisor,
}: VentaRegistradaSuccessDialogProps) {
  const [busy, setBusy] = useState<"copy" | "pdf" | "guia" | null>(null);

  if (!form) return null;

  const lines = resolveVentaLineItems(form);
  const { total } = calculateCartTotals(lines);
  const waLink = buildWhatsAppMeLink(form.celular);

  const handleCopy = async () => {
    setBusy("copy");
    try {
      await copyTextToClipboard(buildVentaClienteShareText(form));
      toast.success("Datos copiados al portapapeles");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    } finally {
      setBusy(null);
    }
  };

  const handleVerPdf = async () => {
    setBusy("pdf");
    try {
      if (form.tipoComprobante === "Cotización") {
        const { generateProformaPdf } = await import("@/lib/pdf/generate-proforma-pdf");
        await generateProformaPdf(form, emisor);
      } else if (form.tipoComprobante === "Guía de Remisión") {
        const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
        await generateGuiaRemisionPdf(form, emisor);
      } else {
        const { generateComprobantePdf } = await import("@/lib/pdf/generate-comprobante-pdf");
        await generateComprobantePdf(form, emisor);
      }
      toast.success("PDF generado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setBusy(null);
    }
  };

  const handleGuiaRemision = async () => {
    setBusy("guia");
    try {
      const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
      await generateGuiaRemisionPdf(form, emisor);
      toast.success("Guía de remisión PDF generada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar la guía");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl">
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 pb-8 pt-7 text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.25} />
          </div>
          <DialogTitle className="text-center text-xl font-semibold tracking-tight text-white">
            ¡Felicitaciones!
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-center text-sm text-emerald-50">
            La venta se registró correctamente.
          </DialogDescription>
          <p className="mt-4 text-center text-2xl font-bold tabular-nums">
            {formatVentaCurrency(total, form.moneda)}
          </p>
          <p className="mt-1 text-center text-xs text-emerald-100">
            {form.tipoComprobante} · Serie {form.serie}
          </p>
        </div>

        <div className="space-y-4 bg-white px-6 py-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">{form.cliente || "Cliente"}</p>
            {form.clienteRuc ? <p className="mt-0.5 text-slate-500">RUC {form.clienteRuc}</p> : null}
            <div className="mt-2 grid gap-1 text-slate-600">
              {form.contacto ? <p>Contacto: {form.contacto}</p> : null}
              {form.celular ? <p>Celular: {form.celular}</p> : null}
              {form.direccion ? <p>Dirección: {form.direccion}</p> : null}
              {form.tipoCliente ? <p>Tipo: {form.tipoCliente}</p> : null}
            </div>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-medium text-emerald-700 underline-offset-2 hover:underline"
              >
                Abrir WhatsApp
              </a>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              onClick={() => void handleCopy()}
              disabled={busy !== null}
              className="h-10 bg-slate-900 text-white hover:bg-slate-800"
            >
              <Copy className="mr-2 h-4 w-4" />
              {busy === "copy" ? "Copiando..." : "Copiar datos + link WhatsApp"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleVerPdf()}
              disabled={busy !== null}
              className="h-10 border-slate-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              {busy === "pdf" ? "Generando..." : "Ver PDF"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleGuiaRemision()}
              disabled={busy !== null}
              className="h-10 border-slate-200"
            >
              <Truck className="mr-2 h-4 w-4" />
              {busy === "guia" ? "Generando..." : "Generar Guía de Remisión"}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 w-full text-slate-500 hover:text-slate-800"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
