import { Bell, BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type AnunciosWikiHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewPage: () => void;
  onGoHome: () => void;
  activePageTitle?: string | null;
  className?: string;
};

export function AnunciosWikiHeader({
  search,
  onSearchChange,
  onNewPage,
  onGoHome,
  activePageTitle,
  className,
}: AnunciosWikiHeaderProps) {
  return (
    <header className={cn("shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <BookOpen className="h-6 w-6 shrink-0 text-slate-700" strokeWidth={1.75} />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Wiki</h1>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar en la Wiki..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <button
            type="button"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <Button
            type="button"
            onClick={onNewPage}
            className="h-9 gap-1.5 bg-[#2563eb] px-3 text-sm font-semibold hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva página</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      <Breadcrumb className="mt-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button" onClick={onGoHome} className="text-slate-500 hover:text-slate-800">
                Inicio
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {activePageTitle ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button type="button" onClick={onGoHome} className="text-slate-500 hover:text-slate-800">
                    Wiki
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate text-slate-700 sm:max-w-none">
                  {activePageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-700">Wiki</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
