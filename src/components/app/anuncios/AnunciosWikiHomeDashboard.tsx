import { MoreVertical, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  wikiActivityFeed,
  wikiRecentPagesSeed,
  type WikiRecentPageItem,
} from "@/lib/anuncios/wiki-dashboard-data";
import { cn } from "@/lib/utils";

type AnunciosWikiHomeDashboardProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPage: (pageId: string) => void;
  recentPages?: WikiRecentPageItem[];
};

function RecentPageRow({
  item,
  onSelect,
}: {
  item: WikiRecentPageItem;
  onSelect: (pageId: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.pageId)}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          item.iconBg,
        )}
      >
        <Icon className={cn("h-5 w-5", item.iconColor)} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          <span className={cn("font-medium", item.tagClassName)}>{item.tagLabel}</span>
          {" · "}
          Actualizado por {item.updatedBy} · {item.updatedAt}
        </p>
      </div>
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400"
        aria-hidden
      >
        <MoreVertical className="h-4 w-4" />
      </span>
    </button>
  );
}

export function AnunciosWikiHomeDashboard({
  search,
  onSearchChange,
  onSelectPage,
  recentPages = wikiRecentPagesSeed,
}: AnunciosWikiHomeDashboardProps) {
  const query = search.trim().toLowerCase();
  const filteredRecent = query
    ? recentPages.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.tagLabel.toLowerCase().includes(query) ||
          item.updatedBy.toLowerCase().includes(query),
      )
    : recentPages;

  const filteredActivity = query
    ? wikiActivityFeed.filter(
        (item) =>
          item.pageTitle.toLowerCase().includes(query) ||
          item.userName.toLowerCase().includes(query),
      )
    : wikiActivityFeed;

  return (
    <div className="min-w-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center justify-center sm:w-44">
            <div className="relative flex h-28 w-36 items-end justify-center">
              <div className="absolute bottom-0 h-20 w-24 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-md" />
              <div className="absolute bottom-2 left-2 h-16 w-20 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md" />
              <div className="absolute bottom-4 right-0 h-14 w-16 rounded-lg bg-gradient-to-br from-sky-300 to-blue-400 shadow-md" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Bienvenido a la Wiki 👋</h2>
            <p className="mt-1 text-sm text-slate-600">
              Aquí encontrarás toda la información y documentación clave de la empresa.
            </p>
            <div className="relative mt-4 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar en la Wiki..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Páginas recientes</h3>
          <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            Ver todas
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredRecent.length > 0 ? (
            filteredRecent.map((item) => (
              <RecentPageRow key={item.id} item={item} onSelect={onSelectPage} />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No hay páginas que coincidan con tu búsqueda.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Actividad reciente</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredActivity.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.pageId && onSelectPage(item.pageId)}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-slate-200 hover:bg-white"
            >
              <div className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn("text-[10px] font-semibold", item.avatarColor)}>
                    {item.userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-800">{item.userName}</span>{" "}
                    {item.action}{" "}
                    <span className="font-semibold text-slate-800">{item.pageTitle}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.timeAgo}</p>
                </div>
              </div>
              <div className="mt-3 h-px w-full bg-gradient-to-r from-slate-200 via-blue-300 to-transparent" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
