import { BarChart3, Clock, Percent, Target, Trophy } from "lucide-react";
import { ModuleResumenPanel } from "@/components/app/module-shell/ModuleResumenPanel";
import type { CrmSnapshot } from "@/lib/crm/crm-service";
import { formatPipelineCurrency } from "@/lib/crm/crm-service";

type CrmResumenPanelProps = {
  snapshot?: CrmSnapshot | null;
  className?: string;
};

export function CrmResumenPanel({ snapshot, className }: CrmResumenPanelProps) {
  const kpis = snapshot?.pipelineKpis ?? snapshot?.kpis ?? [];
  const columns = snapshot?.pipelineColumns ?? [];

  const metrics = [
    {
      label: "Oportunidades",
      value: kpis[0]?.value ?? "0",
      icon: Target,
      tone: "green" as const,
    },
    {
      label: "Pipeline",
      value: kpis[1]?.value ?? "S/ 0",
      icon: BarChart3,
      tone: "blue" as const,
    },
    {
      label: "Cierre",
      value: kpis[2]?.value ?? "0%",
      icon: Percent,
      tone: "purple" as const,
    },
    {
      label: "Ganadas",
      value: kpis[3]?.value ?? "S/ 0",
      icon: Trophy,
      tone: "orange" as const,
    },
  ];

  const breakdownRows =
    columns.length > 0
      ? columns.map((column) => ({
          label: column.title,
          amount: formatPipelineCurrency(column.totalValue),
          count: column.count,
        }))
      : [{ label: "Sin datos", amount: "S/ 0.00", count: 0 }];

  return (
    <ModuleResumenPanel
      title="Resumen CRM"
      metrics={metrics}
      breakdownTitle="Por etapa"
      breakdownRows={breakdownRows}
      className={className}
      footer={
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Clock className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            Total registradas{" "}
            <strong className="font-bold text-slate-800">
              {snapshot?.totalRecords ?? 0}
            </strong>
          </span>
        </div>
      }
    />
  );
}
