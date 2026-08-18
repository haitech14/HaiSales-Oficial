import { FileText, Headphones, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  wikiFeaturedPages,
  wikiMainCategories,
} from "@/lib/anuncios/wiki-dashboard-data";
import { cn } from "@/lib/utils";

type AnunciosWikiRightSidebarProps = {
  onSelectPage: (pageId: string) => void;
  onSelectCategory: (sectionId: string) => void;
  className?: string;
};

export function AnunciosWikiRightSidebar({
  onSelectPage,
  onSelectCategory,
  className,
}: AnunciosWikiRightSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-[#f7f8fa] p-4 xl:flex",
        className,
      )}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Categorías principales</h3>
          <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            Ver todas
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {wikiMainCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.sectionId)}
                className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 px-2 py-3 text-center transition hover:border-slate-200 hover:bg-white"
              >
                <span
                  className={cn(
                    "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                    category.iconBg,
                  )}
                >
                  <Icon className={cn("h-5 w-5", category.iconColor)} strokeWidth={1.75} />
                </span>
                <span className="text-xs font-semibold text-slate-800">{category.label}</span>
                <span className="mt-0.5 text-[10px] text-slate-500">{category.pageCount} páginas</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Páginas destacadas</h3>
          <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            Ver todas
          </button>
        </div>
        <ul className="space-y-1">
          {wikiFeaturedPages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onSelectPage(page.pageId)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                  {page.starred && <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" />}
                  {page.title}
                </span>
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  Importante
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">¿Necesitas ayuda?</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Si no encuentras lo que buscas, contacta al administrador o crea una nueva página.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-9 w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          <Headphones className="h-4 w-4" />
          Contactar Soporte
        </Button>
      </section>
    </aside>
  );
}
