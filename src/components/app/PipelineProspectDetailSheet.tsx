import { useEffect, useState } from "react";
import { Building2, Calendar, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  fetchProspectDetail,
  formatCurrency,
  formatPipelineCurrency,
  getProbabilityStyles,
  getStageStyles,
} from "@/lib/crm/crm-service";
import type { ProspectDetail } from "@/lib/crm-mock-data";
import { cn } from "@/lib/utils";

type PipelineProspectDetailSheetProps = {
  codigo: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export function PipelineProspectDetailSheet({
  codigo,
  open,
  onOpenChange,
  userId,
}: PipelineProspectDetailSheetProps) {
  const [detail, setDetail] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !codigo || !userId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    void fetchProspectDetail(codigo, userId).then((result) => {
      setDetail(result);
      setLoading(false);
    });
  }, [open, codigo, userId]);

  const subtitleParts = detail?.subtitulo
    ? detail.subtitulo.split("·").map((part) => part.trim()).filter(Boolean)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail?.clienteNombre ?? "Detalle del prospecto"}</SheetTitle>
          <SheetDescription>
            {detail?.codigo ? `Oportunidad ${detail.codigo}` : "Información comercial y de seguimiento"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando prospecto...
          </div>
        ) : detail ? (
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap gap-2">
                {detail.statusBadge && (
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {detail.statusBadge}
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                    getStageStyles(detail.etapa),
                  )}
                >
                  {detail.pipelineStage}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                    getProbabilityStyles(detail.probabilidad),
                  )}
                >
                  {detail.probabilidad}% probabilidad
                </span>
              </div>

              <p className="mt-3 text-base font-semibold text-slate-900">{detail.titulo}</p>
              {subtitleParts.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {subtitleParts.map((part) => (
                    <li key={part}>{part}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-lg font-bold text-blue-600">{formatPipelineCurrency(detail.valor)}</p>
            </div>

            <section className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <DetailRow label="RUC" value={detail.clienteRuc || "—"} />
                <DetailRow
                  label="Tipo"
                  value={detail.cliente?.tipoCliente ?? subtitleParts.find((p) => !p.includes(":")) ?? "—"}
                />
                <DetailRow label="Segmento" value={detail.cliente?.segmento ?? "—"} />
                <DetailRow label="Estado" value={detail.cliente?.estadoComercial ?? "Prospecto"} />
              </dl>

              {(detail.cliente?.telefono || detail.cliente?.correo || detail.cliente?.direccion) && (
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {detail.cliente.telefono && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {detail.cliente.telefono}
                    </li>
                  )}
                  {detail.cliente.correo && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {detail.cliente.correo}
                    </li>
                  )}
                  {(detail.cliente.direccion || detail.cliente.ciudad) && (
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        {[detail.cliente.direccion, detail.cliente.ciudad].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seguimiento</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <DetailRow label="Fecha oportunidad" value={`${detail.fechaOportunidad} ${detail.horaOportunidad}`} />
                <DetailRow label="Cierre estimado" value={detail.fechaCierreEstimada ?? "—"} />
              </dl>
              <div className="mt-3 flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700">
                    {detail.responsableIniciales}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-slate-500">Responsable</p>
                  <p className="font-medium text-slate-800">{detail.responsable}</p>
                </div>
              </div>
              {detail.cliente?.ejecutivo && detail.cliente.ejecutivo !== detail.responsable && (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Ejecutivo cartera: {detail.cliente.ejecutivo}
                </p>
              )}
            </section>

            {detail.ventasRecientes.length > 0 && (
              <section className="rounded-xl border border-slate-200 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Compras recientes
                </h3>
                <ul className="mt-3 space-y-2">
                  {detail.ventasRecientes.map((venta) => (
                    <li
                      key={venta.codigo}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{venta.codigo}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {venta.fecha}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-900">{formatCurrency(venta.total)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.cliente?.observaciones && (
              <section className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">Observaciones</p>
                <p className="mt-1">{detail.cliente.observaciones}</p>
              </section>
            )}

            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              Datos sincronizados desde clientes y ventas
            </p>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No se encontró el prospecto.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
