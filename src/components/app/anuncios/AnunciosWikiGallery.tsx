import {
  ChevronDown,
  Filter,
  LayoutGrid,
  Maximize2,
  Plus,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WikiPageCard } from "@/lib/anuncios/anuncios-mock-data";
import { cn } from "@/lib/utils";

type AnunciosWikiGalleryProps = {
  pages: WikiPageCard[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPage: (pageId: string) => void;
  onNewPage?: () => void;
};

export function AnunciosWikiGallery({
  pages,
  search,
  onSearchChange,
  onSelectPage,
  onNewPage,
}: AnunciosWikiGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
          <LayoutGrid className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate font-medium">Páginas de la wiki</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-slate-500">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar"
              className="h-8 w-36 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 sm:w-44"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" aria-label="Pantalla completa">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1 rounded-lg bg-[#0b7cff] px-3 text-xs font-semibold hover:bg-[#0066e0]"
            onClick={onNewPage}
          >
            Nuevo
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => onSelectPage(page.id)}
            className={cn(
              "group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition",
              "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
            )}
          >
            <div
              className={cn(
                "relative flex h-28 items-end bg-gradient-to-br px-3 py-2",
                page.coverGradient,
              )}
            >
              {page.coverLabel && (
                <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-white">
                  {page.coverLabel}
                </span>
              )}
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none" aria-hidden>
                  {page.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{page.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{page.updatedAt}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {page.tags.map((tag) => (
                  <span
                    key={`${page.id}-${tag.label}`}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      tag.className,
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNewPage}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <Plus className="h-4 w-4" />
        Nueva página
      </button>
    </div>
  );
}
