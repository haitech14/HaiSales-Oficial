import {
  Boxes,
  Building2,
  Truck,
  UserCircle,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ModuleIconFilterBar } from "@/components/app/module-shell/ModuleIconFilterBar";
import { clientesTabs } from "@/lib/clientes/clientes-service";

type ClientesFilterBarProps = {
  activeTab: string;
  tabCounts: Record<string, number | null | undefined>;
  onTabChange: (tabId: string) => void;
  className?: string;
};

const TAB_ICONS: Record<string, LucideIcon> = {
  todos: Users,
  publico: UserCircle,
  distribuidor: Building2,
  tecnico: Wrench,
  mayorista: Boxes,
  proveedor: Truck,
};

export function ClientesFilterBar({
  activeTab,
  tabCounts,
  onTabChange,
  className,
}: ClientesFilterBarProps) {
  const items = clientesTabs.map((tab) => {
    const count = tabCounts[tab.id];
    const countLabel =
      typeof count === "number" && tab.id !== "todos"
        ? ` (${count.toLocaleString("es-PE")})`
        : "";

    return {
      id: tab.id,
      label: `${tab.label}${countLabel}`,
      Icon: TAB_ICONS[tab.id] ?? UserCircle,
    };
  });

  return (
    <ModuleIconFilterBar
      items={items}
      activeId={activeTab}
      onChange={onTabChange}
      activeClassName="bg-[#43a047]"
      className={className}
    />
  );
}
