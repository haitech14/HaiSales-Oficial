import { Users } from "lucide-react";
import { DocumentSearchIcon } from "@/components/app/icons/DocumentSearchIcon";
import { clientesTabs } from "@/lib/clientes/clientes-service";
import { cn } from "@/lib/utils";

type ClientesFilterBarProps = {
  activeTab: string;
  tabCounts: Record<string, number | null | undefined>;
  onTabChange: (tabId: string) => void;
  className?: string;
};

const TAB_LABELS: Record<string, string> = {
  todos: "Todos",
};

export function ClientesFilterBar({
  activeTab,
  tabCounts,
  onTabChange,
  className,
}: ClientesFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {clientesTabs.map((tab) => {
        const active = activeTab === tab.id;
        const label = TAB_LABELS[tab.id] ?? tab.label;
        const count = tabCounts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full py-2 text-xs font-semibold transition sm:text-sm",
              active
                ? "gap-2 bg-[#43a047] pl-3 pr-4 text-white shadow-sm"
                : "bg-[#d1d5db] px-4 text-slate-600 hover:bg-[#c4c9d0]",
            )}
          >
            {active ? (
              tab.id === "todos" ? (
                <Users className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              ) : (
                <DocumentSearchIcon className="h-[18px] w-[18px] shrink-0" />
              )
            ) : null}
            {label}
            {typeof count === "number" && tab.id !== "todos" ? (
              <span className={cn("ml-0.5", active ? "text-white/90" : "text-slate-400")}>
                ({count.toLocaleString("es-PE")})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
