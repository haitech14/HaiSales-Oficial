import { SlidersHorizontal } from "lucide-react";
import { inboxViewTabs } from "@/lib/inbox/channels";
import type { InboxViewFilter } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxFilterBarProps = {
  tabs?: { id: InboxViewFilter; label: string; count?: number }[];
  activeView: InboxViewFilter;
  onViewChange: (view: InboxViewFilter) => void;
};

export function InboxFilterBar({ tabs = inboxViewTabs, activeView, onViewChange }: InboxFilterBarProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onViewChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Más filtros
      </button>
    </div>
  );
}
