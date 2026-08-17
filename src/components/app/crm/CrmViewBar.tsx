import type { ComponentType } from "react";
import { LayoutGrid, List, MessageSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const CRM_ACTIVE_COLOR = "#7e57c2";

type CrmView = "pipeline" | "conversaciones";
type ViewMode = "kanban" | "tabla";

type CrmViewBarProps = {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
};

function ViewPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full py-2 text-xs font-semibold transition sm:text-sm",
        active
          ? "gap-2 pl-3 pr-4 text-white shadow-sm"
          : "bg-[#d1d5db] px-4 text-slate-600 hover:bg-[#c4c9d0]",
      )}
      style={active ? { backgroundColor: CRM_ACTIVE_COLOR } : undefined}
    >
      {active ? <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} /> : null}
      {label}
    </button>
  );
}

export function CrmViewBar({
  activeView,
  onViewChange,
  viewMode = "kanban",
  onViewModeChange,
  className,
}: CrmViewBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <ViewPill
        label="Pipeline"
        icon={Target}
        active={activeView === "pipeline"}
        onClick={() => onViewChange("pipeline")}
      />
      <ViewPill
        label="Conversaciones"
        icon={MessageSquare}
        active={activeView === "conversaciones"}
        onClick={() => onViewChange("conversaciones")}
      />

      {activeView === "pipeline" && onViewModeChange ? (
        <>
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm",
              viewMode === "kanban"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-500",
            )}
            aria-label="Kanban"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("tabla")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm",
              viewMode === "tabla"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-500",
            )}
            aria-label="Tabla"
          >
            <List className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}
