import { Calendar, User } from "lucide-react";
import type { VentaRecord } from "@/lib/ventas-mock-data";
import {
  formatVentasCardDateTime,
  formatVentasMockAmount,
  getVentaDocumentLabel,
} from "@/lib/ventas/ventas-page-utils";
import { cn } from "@/lib/utils";

type VentasComprobanteCardProps = {
  record: VentaRecord;
  onOpenPdf?: () => void;
};

export function VentasComprobanteCard({ record, onOpenPdf }: VentasComprobanteCardProps) {
  const anulada = record.businessStatus === "Anulada";
  const clientLine = `${record.client}${record.ruc && record.ruc !== "—" ? ` (${record.ruc})` : ""}`;

  return (
    <button
      type="button"
      onClick={onOpenPdf}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-bold text-slate-900">{getVentaDocumentLabel(record.documentType)}</p>
        <p className="shrink-0 text-sm font-medium text-slate-400">{record.documentCode}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{clientLine}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <span>{formatVentasCardDateTime(record.date, record.time)}</span>
        </div>
        <p
          className={cn(
            "shrink-0 text-base font-bold",
            anulada ? "text-slate-400 line-through" : "text-[#8cc63f]",
          )}
        >
          {formatVentasMockAmount(record.amount)}
        </p>
      </div>
    </button>
  );
}
