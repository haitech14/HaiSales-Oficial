import { Box, Clock, Package, RotateCw, TrendingDown } from "lucide-react";
import { ModuleResumenPanel } from "@/components/app/module-shell/ModuleResumenPanel";
import type { InventarioSnapshot } from "@/lib/inventario/types";
import { inventarioTabs } from "@/lib/inventario-mock-data";

type InventarioResumenPanelProps = {
  snapshot?: InventarioSnapshot | null;
  className?: string;
};

export function InventarioResumenPanel({ snapshot, className }: InventarioResumenPanelProps) {
  const kpis = snapshot?.kpis ?? [];
  const tabCounts = snapshot?.tabCounts ?? {};

  const metrics = [
    {
      label: "Activos",
      value: kpis[0]?.value ?? "0",
      icon: Package,
      tone: "green" as const,
    },
    {
      label: "Valorizado",
      value: kpis[1]?.value ?? "S/ 0",
      icon: Box,
      tone: "blue" as const,
    },
    {
      label: "Stock bajo",
      value: kpis[2]?.value ?? "0",
      icon: TrendingDown,
      tone: "purple" as const,
    },
    {
      label: "Sin movimiento",
      value: kpis[3]?.value ?? "0x",
      icon: RotateCw,
      tone: "orange" as const,
    },
  ];

  const breakdownRows = inventarioTabs
    .filter((tab) => tab.id !== "todos")
    .slice(0, 5)
    .map((tab) => ({
      label: tab.label,
      amount: "—",
      count: tabCounts[tab.id] ?? 0,
    }));

  return (
    <ModuleResumenPanel
      title="Resumen inventario"
      metrics={metrics}
      breakdownTitle="Por estado"
      breakdownRows={breakdownRows}
      className={className}
      footer={
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Clock className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            Productos en catálogo{" "}
            <strong className="font-bold text-slate-800">
              {snapshot?.totalRecords ?? 0}
            </strong>
          </span>
        </div>
      }
    />
  );
}
