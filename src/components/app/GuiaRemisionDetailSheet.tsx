import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchGuiaRemisionDetail, getGuiaEstadoStyles } from "@/lib/logistica/guias-service";
import type { GuiaRemisionDetail } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

type GuiaRemisionDetailSheetProps = {
  guiaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
};

export function GuiaRemisionDetailSheet({
  guiaId,
  open,
  onOpenChange,
  userId,
}: GuiaRemisionDetailSheetProps) {
  const [detail, setDetail] = useState<GuiaRemisionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !guiaId || !userId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    void fetchGuiaRemisionDetail(guiaId, userId).then((result) => {
      setDetail(result);
      setLoading(false);
    });
  }, [open, guiaId, userId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail?.codigoGuia ?? "Guía de remisión"}</SheetTitle>
          <SheetDescription>Detalle de guía remitente y líneas despachadas.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando guía...
          </div>
        ) : detail ? (
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">{detail.destinatario}</p>
              <p className="text-slate-600">RUC {detail.ruc}</p>
              <p className="mt-2 text-slate-600">{detail.direccionDestino}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("app-table-badge", getGuiaEstadoStyles(detail.estado))}>
                  {detail.estado}
                </span>
                <span className="app-table-badge border-slate-200 bg-white text-slate-600">
                  {detail.motivoTraslado}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Emisión</dt>
                <dd className="font-medium">{detail.fecha}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Traslado</dt>
                <dd className="font-medium">{detail.fechaTraslado}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Conductor</dt>
                <dd className="font-medium">{detail.conductor}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Placa</dt>
                <dd className="font-medium">{detail.placa ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Bultos</dt>
                <dd className="font-medium">{detail.bultos ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Peso total</dt>
                <dd className="font-medium">{detail.pesoTotal ?? "—"}</dd>
              </div>
            </dl>

            {detail.comprobanteRelacionado && (
              <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800">
                Comprobante vinculado: <strong>{detail.comprobanteRelacionado}</strong>
              </p>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ítems ({detail.items.length})
              </p>
              <ul className="space-y-2">
                {detail.items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-800">{item.descripcion}</p>
                    <p className="text-xs text-slate-500">
                      {item.cantidad} {item.unidad}
                      {item.codigo ? ` · Cód. ${item.codigo}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No se encontró la guía.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
