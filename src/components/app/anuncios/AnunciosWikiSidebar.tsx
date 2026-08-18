import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { wikiIndexTree } from "@/lib/anuncios/wiki-dashboard-data";
import { cn } from "@/lib/utils";

type AnunciosWikiSidebarProps = {
  activePageId: string | null;
  activeSectionId: string;
  onSelectPage: (pageId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onNewPage: () => void;
  className?: string;
};

export function AnunciosWikiSidebar({
  activePageId,
  activeSectionId,
  onSelectPage,
  onSelectSection,
  onNewPage,
  className,
}: AnunciosWikiSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    empresa: true,
    procesos: true,
    documentacion: true,
    recursos: false,
  });

  const toggleFolder = (folderId: string) => {
    setExpanded((current) => ({ ...current, [folderId]: !current[folderId] }));
  };

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Índice</h2>
        <button
          type="button"
          onClick={onNewPage}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Nueva página"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Índice Wiki">
        <ul className="space-y-1">
          {wikiIndexTree.map((folder) => {
            const isOpen = expanded[folder.id] ?? false;
            const isSectionActive = activeSectionId === folder.id && !activePageId;

            return (
              <li key={folder.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggleFolder(folder.id);
                    onSelectSection(folder.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium transition",
                    isSectionActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  )}
                  <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {folder.number}. {folder.label}
                  </span>
                </button>

                {isOpen && (
                  <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                    {folder.children.map((child) => {
                      const isActive = activePageId === child.pageId;
                      return (
                        <li key={child.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (child.pageId) {
                                onSelectPage(child.pageId);
                              } else {
                                onSelectSection(folder.id);
                              }
                            }}
                            className={cn(
                              "w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition",
                              isActive
                                ? "bg-blue-50 font-medium text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            )}
                          >
                            {child.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full justify-start gap-2 border-slate-200 text-xs text-slate-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Papelera
        </Button>
      </div>
    </aside>
  );
}
