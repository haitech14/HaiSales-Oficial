import type { ComponentType } from "react";
import { ClipboardList, FileClock, MapPin } from "lucide-react";
import { ModuleIconFilterBar } from "@/components/app/module-shell/ModuleIconFilterBar";
import type { ServiciosFilterMode } from "@/lib/servicios/servicios-page-utils";

type ServiciosFilterBarProps = {
  mode: ServiciosFilterMode;
  onModeChange: (mode: ServiciosFilterMode) => void;
  className?: string;
};

const SERVICIOS_FILTERS: Array<{
  id: ServiciosFilterMode;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: "ordenes", label: "Órdenes", Icon: ClipboardList },
  { id: "cotizaciones", label: "Cotizaciones", Icon: FileClock },
  { id: "visitas", label: "Visitas", Icon: MapPin },
];

export function ServiciosFilterBar({ mode, onModeChange, className }: ServiciosFilterBarProps) {
  return (
    <ModuleIconFilterBar
      items={SERVICIOS_FILTERS}
      activeId={mode}
      onChange={(id) => onModeChange(id as ServiciosFilterMode)}
      activeClassName="bg-[#8cc63f]"
      className={className}
    />
  );
}
