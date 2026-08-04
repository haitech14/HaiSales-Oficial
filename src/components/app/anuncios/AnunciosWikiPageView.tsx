import { AnunciosWikiBlocksView } from "@/components/app/anuncios/AnunciosWikiBlocksView";
import { AnunciosWikiHomeEditor } from "@/components/app/anuncios/AnunciosWikiHomeEditor";
import { AnunciosWikiMuralView } from "@/components/app/anuncios/AnunciosWikiMuralView";
import { AnunciosWikiTableView } from "@/components/app/anuncios/AnunciosWikiTableView";
import { AnunciosWikiTodosView } from "@/components/app/anuncios/AnunciosWikiTodosView";
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
}: AnunciosWikiPageViewProps) {
  void onTitleChange;
  void onViewTypeChange;

  // Vista fija según page.viewType (por defecto Kanban); sin selector de pestañas.
  if (page.viewType === "blocks") {
    return <AnunciosWikiBlocksView blocks={page.blocks ?? []} onChange={onBlocksChange} />;
  }
  if (page.viewType === "gallery") {
    return <PageGallery cards={page.galleryCards} />;
  }
  if (page.viewType === "mural") {
    return (
      <AnunciosWikiMuralView columns={page.muralColumns ?? []} onChange={onMuralChange} />
    );
  }
  if (page.viewType === "table") {
    return <AnunciosWikiTableView table={page.table} onChange={onTableChange} />;
  }
  if (page.viewType === "todos") {
    return (
      <AnunciosWikiTodosView
        todos={page.todos}
        links={page.links}
        onTodosChange={onTodosChange}
        onLinksChange={onLinksChange}
      />
    );
  }

  void onAddKanbanColumn;
  void onAddKanbanCard;

  return (
    <AnunciosWikiHomeEditor
      columns={page.kanbanColumns}
      onChange={onKanbanChange}
      className="min-h-[520px]"
    />
  );
}
