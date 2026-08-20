import type { ComponentType } from "react";
import { FileClock, FileText, Receipt } from "lucide-react";
import { ModuleIconFilterBar } from "@/components/app/module-shell/ModuleIconFilterBar";
import type { VentasFilterMode } from "@/lib/ventas/ventas-page-utils";

type VentasFilterBarProps = {
  mode: VentasFilterMode;
  onModeChange: (mode: VentasFilterMode) => void;
  className?: string;
};

const VENTAS_FILTERS: Array<{
  id: VentasFilterMode;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: "comprobantes", label: "Comprobantes", Icon: Receipt },
  { id: "nota-venta", label: "Nota de venta", Icon: FileText },
  { id: "proformas", label: "Proformas", Icon: FileClock },
];

export function VentasFilterBar({ mode, onModeChange, className }: VentasFilterBarProps) {
  return (
    <ModuleIconFilterBar
      items={VENTAS_FILTERS}
      activeId={mode}
      onChange={(id) => onModeChange(id as VentasFilterMode)}
      activeClassName="bg-[#8cc63f]"
      className={className}
    />
  );
}
