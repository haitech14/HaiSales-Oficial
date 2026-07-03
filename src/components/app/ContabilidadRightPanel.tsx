import { RefreshCw } from "lucide-react";
import type { ContabilidadSnapshot } from "@/lib/contabilidad/contabilidad-service";
import { cn } from "@/lib/utils";

const SECTION_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#ef4444"];

export function ContabilidadRightPanel({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: ContabilidadSnapshot | null;
}) {
  const records = snapshot?.records ?? [];
  const sectionTotals = records.reduce((map, record) => {
    map.set(record.section, (map.get(record.section) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  const sections = [...sectionTotals.entries()].map(([label, count], index) => ({
    label,
    count,
    percent: records.length > 0 ? Math.round((count / records.length) * 100) : 0,
    color: SECTION_COLORS[index % SECTION_COLORS.length],
  }));

  let dashOffset = 0;
  const donutSegments = sections.map((section) => {
    const dash = `${section.percent} ${100 - section.percent}`;
    const offset = -dashOffset;
    dashOffset += section.percent;
    return { ...section, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Distribución contable</h3>
          {records.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin asientos contables registrados.</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {donutSegments.map((section) => (
                    <circle
                      key={section.label}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={section.color}
                      strokeWidth="3"
                      strokeDasharray={section.dash}
                      strokeDashoffset={section.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{records.length}</span>
                  <span className="app-panel-meta">Total</span>
                </div>
              </div>
              <ul className="app-panel-list min-w-0 flex-1">
                {sections.map((section) => (
                  <li key={section.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span className="truncate capitalize">{section.label.replace("-", " ")}</span>
                    <span className="shrink-0 font-semibold text-slate-800">{section.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{records.length} registros sincronizados</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
