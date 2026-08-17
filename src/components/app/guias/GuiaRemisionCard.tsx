import { Calendar, MapPin, Truck, User } from "lucide-react";
import type { GuiaRemision } from "@/lib/logistica/types";
import { formatGuiaCardDateTime } from "@/lib/logistica/guias-page-utils";
import { getGuiaEstadoStyles } from "@/lib/logistica/guias-service";
import { cn } from "@/lib/utils";

type GuiaRemisionCardProps = {
  guia: GuiaRemision;
  onOpen?: () => void;
};

export function GuiaRemisionCard({ guia, onOpen }: GuiaRemisionCardProps) {
  const destinatarioLine = `${guia.destinatario}${guia.ruc && guia.ruc !== "—" ? ` (${guia.ruc})` : ""}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-bold text-slate-900">Guía de Remisión</p>
        <p className="shrink-0 text-sm font-medium text-slate-400">{guia.codigoGuia}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{destinatarioLine}</span>
      </div>

      {guia.sucursal ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <span className="truncate">{guia.sucursal}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <span>{formatGuiaCardDateTime(guia.fecha, guia.hora)}</span>
        </div>
        <span className={cn("app-table-badge shrink-0 text-[11px]", getGuiaEstadoStyles(guia.estado))}>
          {guia.estado}
        </span>
      </div>

      {guia.conductor && guia.conductor !== "—" ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{guia.conductor}</span>
        </div>
      ) : null}
    </button>
  );
}
