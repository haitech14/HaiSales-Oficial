import { AlertTriangle, Clock, UserCheck, Users } from "lucide-react";
import { ModuleResumenPanel } from "@/components/app/module-shell/ModuleResumenPanel";
import type { ClientesSnapshot } from "@/lib/clientes/clientes-service";
import { clientesTabs } from "@/lib/clientes/clientes-service";

type ClientesResumenPanelProps = {
  snapshot?: ClientesSnapshot | null;
  className?: string;
};

export function ClientesResumenPanel({ snapshot, className }: ClientesResumenPanelProps) {
  const kpis = snapshot?.kpis ?? [];
  const tabCounts = snapshot?.tabCounts ?? {};

  const metrics = [
    {
      label: "Activos",
      value: kpis[0]?.value ?? "0",
      icon: UserCheck,
      tone: "green" as const,
    },
    {
      label: "Total",
      value: String(snapshot?.totalRecords ?? 0),
      icon: Users,
      tone: "blue" as const,
    },
    {
      label: "Prospectos",
      value: kpis[2]?.value ?? "0",
      icon: Users,
      tone: "purple" as const,
    },
    {
      label: "Con deuda",
      value: kpis[3]?.value ?? "0",
      icon: AlertTriangle,
      tone: "orange" as const,
    },
  ];

  const breakdownRows = clientesTabs
    .filter((tab) => tab.id !== "todos")
    .map((tab) => ({
      label: tab.label,
      amount: "—",
      count: tabCounts[tab.id] ?? 0,
    }));

  return (
    <ModuleResumenPanel
      title="Resumen contactos"
      metrics={metrics}
      breakdownTitle="Por tipo"
      breakdownRows={breakdownRows}
      className={className}
      footer={
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Clock className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            Cartera sincronizada{" "}
            <strong className="font-bold text-slate-800">
              {snapshot?.totalRecords ?? 0}
            </strong>
          </span>
        </div>
      }
    />
  );
}
