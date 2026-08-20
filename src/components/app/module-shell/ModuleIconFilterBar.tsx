import type { ComponentType, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type ModuleIconFilterItem = {
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type ModuleIconFilterBarProps = {
  items: ModuleIconFilterItem[];
  activeId: string;
  onChange: (id: string) => void;
  activeClassName?: string;
  activeStyle?: CSSProperties;
  className?: string;
};

export function ModuleIconFilterBar({
  items,
  activeId,
  onChange,
  activeClassName = "bg-[#43a047]",
  activeStyle,
  className,
}: ModuleIconFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map(({ id, label, Icon }) => {
        const active = activeId === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            aria-label={label}
            title={active ? undefined : label}
            style={active ? activeStyle : undefined}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-semibold transition",
              active
                ? cn(
                    "gap-1.5 py-1.5 pl-2.5 pr-3.5 text-xs text-white shadow-sm sm:text-sm",
                    activeClassName,
                  )
                : "h-8 w-8 bg-[#d1d5db] text-slate-600 hover:bg-[#c4c9d0]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {active ? label : null}
          </button>
        );
      })}
    </div>
  );
}
