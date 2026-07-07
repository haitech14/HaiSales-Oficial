import { Inbox, SlidersHorizontal } from "lucide-react";
import { inboxViewTabs } from "@/lib/inbox/channels";
import type { InboxViewFilter } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

export type InboxFilterTab = {
  id: InboxViewFilter;
  label: string;
  count?: number;
};

type InboxFilterBarProps = {
  tabs?: InboxFilterTab[];
  activeView: InboxViewFilter;
  onViewChange: (view: InboxViewFilter) => void;
};

function FilterCountBadge({ count, isActive }: { count: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
      )}
    >
      {count}
    </span>
  );
}

export function InboxFilterBar({ tabs = inboxViewTabs, activeView, onViewChange }: InboxFilterBarProps) {
  return (
    <>
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <Inbox className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
          <span className="text-sm font-semibold text-slate-800">Filtros</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Filtros de Inbox">
          <ul className="space-y-0.5">
            {tabs.map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => onViewChange(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm leading-snug transition",
                      isActive
                        ? "bg-blue-600 font-semibold text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.count !== undefined && (
                      <FilterCountBadge count={tab.count} isActive={isActive} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-200 p-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            Más filtros
          </button>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white md:hidden">
        <nav className="flex gap-1 overflow-x-auto px-4" aria-label="Filtros de Inbox">
          {tabs.map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={cn(
                  "app-tab flex shrink-0 items-center gap-1.5",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
