import { RefreshCw } from "lucide-react";
import type { VentasSnapshot } from "@/lib/ventas/ventas-service";
import { formatPipelineCurrency } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

type VentasRightPanelProps = {
  className?: string;
  snapshot?: VentasSnapshot | null;
};

export function VentasRightPanel({ className, snapshot }: VentasRightPanelProps) {
  const records = snapshot?.records ?? [];
  const total = records.length;
  const facturas = records.filter((item) => item.documentType === "Factura").length;
  const boletas = records.filter((item) => item.documentType === "Boleta").length;
  const notasVenta = records.filter((item) => item.documentType === "Nota de venta").length;
  const notas = records.filter((item) => item.documentType === "Nota de crédito").length;
  const otros = Math.max(0, total - facturas - boletas - notasVenta - notas);
  const distribution = [
    { label: "Facturas", count: facturas, color: "bg-blue-500" },
    { label: "Boletas", count: boletas, color: "bg-violet-500" },
    { label: "Notas de venta", count: notasVenta, color: "bg-teal-500" },
    { label: "Notas crédito", count: notas, color: "bg-orange-500" },
    { label: "Otros", count: otros, color: "bg-slate-400" },
  ].filter((item) => item.count > 0);

  const statusRows = [
    { label: "Aceptados", count: records.filter((item) => item.status === "Aceptado").length, color: "bg-emerald-500" },
    { label: "Pendientes", count: records.filter((item) => item.status === "Pendiente").length, color: "bg-amber-400" },
    { label: "Rechazados", count: records.filter((item) => item.status === "Rechazado").length, color: "bg-red-500" },
  ];

  const totalFacturado = records
    .filter((item) => item.businessStatus !== "Anulada")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Distribución por tipo</h3>
          {total === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin comprobantes en el periodo seleccionado.</p>
          ) : (
            <ul className="app-panel-list mt-4 space-y-2">
              {distribution.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", item.color)} />
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {item.count}{" "}
                    <span className="font-normal text-slate-400">
                      {Math.round((item.count / total) * 100)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Emisión por estado</h3>
          <ul className="mt-3 space-y-3">
            {statusRows.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: total > 0 ? `${Math.round((item.count / total) * 100)}%` : "0%" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Total facturado</h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatPipelineCurrency(totalFacturado)}
          </p>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{total} comprobantes en periodo</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
