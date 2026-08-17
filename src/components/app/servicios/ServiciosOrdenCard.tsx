import { Calendar, User, Wrench } from "lucide-react";
import type { ServicioRecord } from "@/lib/servicios/servicios-mock-data";
import { formatServiciosSoles } from "@/lib/servicios/servicios-page-utils";
import { getServicioEstadoStyles } from "@/lib/servicios/servicios-service";
import { cn } from "@/lib/utils";

type ServiciosOrdenCardProps = {
  record: ServicioRecord;
  onOpen?: () => void;
};

export function ServiciosOrdenCard({ record, onOpen }: ServiciosOrdenCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-bold text-slate-900">{record.serviceType}</p>
        <p className="shrink-0 text-sm font-medium text-slate-400">{record.orderCode}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{record.client}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
        <Wrench className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{record.technician} · {record.equipment}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <span>{record.date}</span>
          <span
            className={cn(
              "ml-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              getServicioEstadoStyles(record.status),
            )}
          >
            {record.status}
          </span>
        </div>
        <p className="shrink-0 text-base font-bold text-[#8cc63f]">
          {formatServiciosSoles(record.amount)}
        </p>
      </div>
    </button>
  );
}
