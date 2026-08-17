import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WikiNavSection } from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiSidebarProps = {
  sections: WikiNavSection[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectSection?: (sectionId: string) => void;
  onNewPage?: () => void;
  className?: string;
};

function SidebarIconButton({
  label,
  active,
  collapsed,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "w-full rounded-lg transition",
        collapsed
          ? "flex items-center justify-center px-1 py-2"
          : "flex items-center gap-2 px-2 py-1.5 text-left text-[13px]",
        active
          ? "bg-slate-100 font-medium text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AnunciosWikiSidebar({
  sections,
  activePageId,
  onSelectPage,
  onSelectSection,
  onNewPage,
  className,
}: AnunciosWikiSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width]",
        collapsed ? "w-[56px]" : "w-56",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-slate-100 px-2 py-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir menú" : "Plegar menú"}
          title={collapsed ? "Expandir" : "Plegar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible py-3",
          collapsed ? "px-1.5" : "space-y-5 px-3",
        )}
        aria-label="Wiki Anuncios"
      >
        {sections.map((section) => (
          <div key={section.id}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => onSelectSection?.(section.id)}
                className="mb-1.5 w-full px-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
              >
                {section.title}
              </button>
            )}
            <ul className={cn(collapsed ? "space-y-1" : "space-y-0.5")}>
              {section.items.map((item) => {
                const isActive = activePageId === item.id;
                return (
                  <li key={item.id}>
                    <SidebarIconButton
                      label={item.label}
                      active={isActive}
                      collapsed={collapsed}
                      onClick={() => onSelectPage(item.id)}
                    >
                      <span
                        className={cn("leading-none", collapsed ? "text-base" : "text-sm")}
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                    </SidebarIconButton>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onNewPage && (
        <div className={cn("border-t border-slate-100", collapsed ? "p-1.5" : "p-3")}>
          {collapsed ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-center px-0 text-xs"
                  onClick={onNewPage}
                  aria-label="Nueva página"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="font-medium">
                Nueva página
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={onNewPage}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva página
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
