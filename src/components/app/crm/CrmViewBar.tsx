import type { ComponentType } from "react";
import { MessageSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const CRM_ACTIVE_COLOR = "#7e57c2";

type CrmView = "pipeline" | "conversaciones";

type CrmViewBarProps = {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
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

export function CrmViewBar({ activeView, onViewChange, className }: CrmViewBarProps) {
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
    </div>
  );
}
