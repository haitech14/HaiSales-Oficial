import { useEffect, useState } from "react";
import { Building2, Calendar, Loader2, Mail, MapPin, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  fetchProspectDetail,
  formatCurrency,
  formatPipelineCurrency,
  getProbabilityStyles,
  getStageStyles,
} from "@/lib/crm/crm-service";
import type { ProspectDetail } from "@/lib/crm-mock-data";
import type { PipelineCard } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

type PipelineProspectDetailSheetProps = {
  codigo: string | null;
  preview?: PipelineCard | null;
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
  preview,
  open,
  onOpenChange,
  userId,
}: PipelineProspectDetailSheetProps) {
  const [detail, setDetail] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !codigo) {
      setDetail(null);
      return;
    }

    if (!userId) {
      setDetail(null);
      setLoading(false);
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
    : preview?.company
      ? preview.company.split("·").map((part) => part.trim()).filter(Boolean)
      : [];

  const displayName = detail?.clienteNombre ?? preview?.title ?? "Detalle del prospecto";
  const displayValue = detail?.valor ?? preview?.value ?? 0;
  const displayOwner = detail?.responsable ?? preview?.owner ?? "—";
  const displayOwnerInitials = detail?.responsableIniciales ?? preview?.ownerInitials ?? "—";
  const displayDate = detail?.fechaOportunidad ?? preview?.dueDate ?? "—";
  const displayCiudad = detail?.cliente?.ciudad ?? preview?.ciudad;
  const displayIntereses = preview?.intereses;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogTitle className="pr-8 text-left text-lg">{displayName}</DialogTitle>
          <DialogDescription className="text-left">
            {codigo ? `Oportunidad ${codigo}` : "Información comercial y de seguimiento"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {loading && !detail && !preview ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando prospecto...
            </div>
          ) : detail || preview ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                {loading && (
                  <p className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Actualizando detalle...
                  </p>
                )}

                {detail && (
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
                )}

                {detail?.titulo && detail.titulo !== displayName && (
                  <p className="mt-3 text-base font-semibold text-slate-900">{detail.titulo}</p>
                )}

                {displayIntereses && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{displayIntereses}</p>
                )}

                {subtitleParts.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {subtitleParts.map((part) => (
                      <li key={part}>{part}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <DetailRow label="Valor" value={formatPipelineCurrency(displayValue)} />
                  <DetailRow label="Responsable" value={displayOwner} />
                  <DetailRow label="Fecha" value={displayDate} />
                  <DetailRow label="Ubicación" value={displayCiudad ?? "—"} />
                </div>
              </div>

              {detail ? (
                <>
                  <section className="rounded-xl border border-slate-200 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</h3>
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      <DetailRow label="RUC" value={detail.clienteRuc || "—"} />
                      <DetailRow
                        label="Tipo"
                        value={detail.cliente?.tipoCliente ?? subtitleParts.find((p) => !p.includes(":")) ?? "—"}
                      />
                      <DetailRow label="Segmento" value={detail.cliente?.segmento ?? "—"} />
                      <DetailRow label="Estado" value={detail.cliente?.estadoComercial ?? "Prospecto"} />
                      <DetailRow label="Contacto" value={detail.cliente?.contacto ?? "—"} />
                      <DetailRow label="Celular" value={detail.cliente?.celular ?? "—"} />
                    </dl>

                    {(detail.cliente?.correo || detail.cliente?.direccion || detail.cliente?.ciudad) && (
                      <ul className="mt-3 space-y-2 text-xs text-slate-600">
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

                  <section className="rounded-xl border border-slate-200 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seguimiento</h3>
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      <DetailRow
                        label="Fecha oportunidad"
                        value={`${detail.fechaOportunidad} ${detail.horaOportunidad}`}
                      />
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
                    <section className="rounded-xl border border-slate-200 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Compras recientes
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {detail.ventasRecientes.map((venta) => (
                          <li
                            key={venta.codigo}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-800">{venta.codigo}</p>
                                <p className="flex items-center gap-1 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  {venta.fecha}
                                </p>
                              </div>
                              <span className="shrink-0 font-semibold text-slate-900">
                                {formatCurrency(venta.total)}
                              </span>
                            </div>

                            {venta.items.length > 0 ? (
                              <ul className="mt-2 space-y-1.5 border-t border-slate-200/80 pt-2">
                                {venta.items.map((item, index) => (
                                  <li
                                    key={`${venta.codigo}-${index}`}
                                    className="flex items-start justify-between gap-3 text-xs"
                                  >
                                    <span className="min-w-0 text-slate-700">
                                      <span className="font-medium text-slate-500">{item.cantidad}×</span>{" "}
                                      {item.descripcion}
                                    </span>
                                    <span className="shrink-0 font-medium text-slate-600">
                                      {formatCurrency(item.subtotal)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 border-t border-slate-200/80 pt-2 text-xs text-slate-400">
                                Sin detalle de productos
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {detail.cliente?.observaciones && (
                    <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-900">
                      <p className="font-semibold">Observaciones</p>
                      <p className="mt-1">{detail.cliente.observaciones}</p>
                    </section>
                  )}

                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Datos sincronizados desde clientes y ventas
                  </p>
                </>
              ) : (
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700">
                        {displayOwnerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-slate-500">Asesor</p>
                      <p className="font-medium text-slate-800">{displayOwner}</p>
                    </div>
                  </div>
                  {displayCiudad && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {displayCiudad}
                    </p>
                  )}
                </section>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No se encontró el prospecto.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
