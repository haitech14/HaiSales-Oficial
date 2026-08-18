import { AnunciosWikiBlocksView } from "@/components/app/anuncios/AnunciosWikiBlocksView";
import { AnunciosWikiHomeEditor } from "@/components/app/anuncios/AnunciosWikiHomeEditor";
import { AnunciosWikiMuralView } from "@/components/app/anuncios/AnunciosWikiMuralView";
import { AnunciosWikiProcesoView } from "@/components/app/anuncios/AnunciosWikiProcesoView";
import { AnunciosWikiTableView } from "@/components/app/anuncios/AnunciosWikiTableView";
import { AnunciosWikiTodosView } from "@/components/app/anuncios/AnunciosWikiTodosView";
import { wikiIndexTree } from "@/lib/anuncios/wiki-dashboard-data";
import type {
  WikiDocBlock,
  WikiGalleryItem,
  WikiKanbanColumn,
  WikiMuralColumn,
  WikiPage,
  WikiViewType,
} from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiPageViewProps = {
  page: WikiPage;
  onTitleChange: (title: string) => void;
  onViewTypeChange: (viewType: WikiViewType) => void;
  onAddKanbanColumn: () => void;
  onAddKanbanCard: (columnId: string) => void;
  onKanbanChange: (columns: WikiKanbanColumn[]) => void;
  onTableChange: (table: WikiPage["table"]) => void;
  onTodosChange: (todos: WikiPage["todos"]) => void;
  onLinksChange: (links: WikiPage["links"]) => void;
  onMuralChange: (columns: WikiMuralColumn[]) => void;
  onBlocksChange: (blocks: WikiDocBlock[]) => void;
  onGoHome: () => void;
};

function PageGallery({ cards }: { cards: WikiGalleryItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className={cn("flex h-24 items-end bg-gradient-to-br px-3 py-2", card.coverGradient)}>
            {card.coverLabel && (
              <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-white">
                {card.coverLabel}
              </span>
            )}
          </div>
          <div className="space-y-1.5 p-3">
            <div className="flex items-center gap-2">
              <span aria-hidden>{card.icon}</span>
              <p className="truncate text-sm font-semibold text-slate-900">{card.title}</p>
            </div>
            <p className="text-[11px] text-slate-400">{card.updatedAt}</p>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                card.tagClassName,
              )}
            >
              {card.tagLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnunciosWikiPageView({
  page,
  onTitleChange,
  onViewTypeChange,
  onAddKanbanColumn,
  onAddKanbanCard,
  onKanbanChange,
  onTableChange,
  onTodosChange,
  onLinksChange,
  onMuralChange,
  onBlocksChange,
  onGoHome,
}: AnunciosWikiPageViewProps) {
  void onTitleChange;
  void onViewTypeChange;
  void onAddKanbanColumn;
  void onAddKanbanCard;

  const folder = wikiIndexTree.find((entry) => entry.id === page.sectionId);
  const sectionLabel = folder?.label ?? page.tagLabel;
  const sectionNumber = folder?.number ?? "";
  const fillCanvas = page.viewType === "kanban" || page.viewType === "mural";
  const isProceso = page.viewType === "proceso";

  if (isProceso) {
    return (
      <AnunciosWikiProcesoView
        page={page}
        sectionLabel={sectionLabel}
        sectionNumber={sectionNumber}
        onGoHome={onGoHome}
        onKanbanChange={onKanbanChange}
        onAddKanbanColumn={onAddKanbanColumn}
      />
    );
  }

  const body =
    page.viewType === "blocks" ? (
      <AnunciosWikiBlocksView blocks={page.blocks ?? []} onChange={onBlocksChange} />
    ) : page.viewType === "gallery" ? (
      <PageGallery cards={page.galleryCards} />
    ) : page.viewType === "mural" ? (
      <AnunciosWikiMuralView columns={page.muralColumns ?? []} onChange={onMuralChange} />
    ) : page.viewType === "table" ? (
      <AnunciosWikiTableView table={page.table} onChange={onTableChange} />
    ) : page.viewType === "todos" ? (
      <AnunciosWikiTodosView
        todos={page.todos}
        links={page.links}
        onTodosChange={onTodosChange}
        onLinksChange={onLinksChange}
      />
    ) : (
      <AnunciosWikiHomeEditor
        columns={page.kanbanColumns}
        onChange={onKanbanChange}
        className="min-h-0 flex-1"
      />
    );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {sectionLabel}
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <span aria-hidden>{page.icon}</span>
          {page.title}
        </h2>
      </header>
      <div
        className={cn(
          "min-h-0 flex-1",
          fillCanvas ? "flex h-full flex-col overflow-hidden" : "overflow-auto px-5 py-5 sm:px-8",
        )}
      >
        {body}
      </div>
    </div>
  );
}
