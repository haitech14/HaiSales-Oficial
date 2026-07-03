import { RefreshCw } from "lucide-react";
import type { GuiaRemision } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

type GuiasRemisionRightPanelProps = {
  className?: string;
  guias: GuiaRemision[];
  totalGuias: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function GuiasRemisionRightPanel({
  className,
  guias,
  totalGuias,
  onRefresh,
  isRefreshing,
}: GuiasRemisionRightPanelProps) {
  const enTransito = guias.filter((guia) => guia.estado === "En tránsito").length;
  const entregadas = guias.filter((guia) => guia.estado === "Entregada").length;
  const conComprobante = guias.filter((guia) => Boolean(guia.comprobanteRelacionado)).length;

  const rows = [
    { label: "En tránsito", count: enTransito, color: "bg-blue-500" },
    { label: "Entregadas", count: entregadas, color: "bg-emerald-500" },
    { label: "Con comprobante", count: conComprobante, color: "bg-violet-500" },
  ];

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Resumen de envíos</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalGuias}</p>
          <p className="mt-1 text-xs text-slate-500">Guías de remisión registradas</p>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Estado de guías</h3>
          <ul className="mt-3 space-y-3">
            {rows.map((row) => (
              <li key={row.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-800">{row.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", row.color)}
                    style={{
                      width: totalGuias > 0 ? `${Math.round((row.count / totalGuias) * 100)}%` : "0%",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Datos reales de Supabase</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
