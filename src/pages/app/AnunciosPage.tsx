import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Home,
  ListTodo,
  Search,
} from "lucide-react";
import { AnunciosWikiHomeEditor } from "@/components/app/anuncios/AnunciosWikiHomeEditor";
import { AnunciosWikiPageView } from "@/components/app/anuncios/AnunciosWikiPageView";
import { AnunciosWikiPendientesSidebar } from "@/components/app/anuncios/AnunciosWikiPendientesSidebar";
import { AnunciosWikiSidebar } from "@/components/app/anuncios/AnunciosWikiSidebar";
import { Button } from "@/components/ui/button";
import { useWikiStore } from "@/hooks/useWikiStore";
import { WIKI_MURAL_SIDEBAR_SECTIONS } from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

export default function AnunciosPage() {
  const {
    navSections,
    activePageId,
    activePage,
    activeSectionId,
    setActiveSectionId,
    selectPage,
    goHome,
    createPage,
    setPageTitle,
    setPageViewType,
    addKanbanCard,
    addKanbanColumn,
    setKanbanColumns,
    setTable,
    setTodos,
    setLinks,
    setMuralColumns,
    setBlocks,
    homeBoard,
    setHomeBoard,
  } = useWikiStore();

  const [headerSearch, setHeaderSearch] = useState("");
  const [pendientesOpen, setPendientesOpen] = useState(false);

  const handleNewPage = () => {
    createPage(activeSectionId || "general");
  };

  const canShowPendientes =
    !!activePage &&
    (WIKI_MURAL_SIDEBAR_SECTIONS as readonly string[]).includes(activePage.sectionId);
  const showPendientesSidebar = canShowPendientes && pendientesOpen;

  return (
    <div className="flex min-h-0 flex-1 bg-[#f7f8fa]">
      <AnunciosWikiSidebar
        sections={navSections}
        activePageId={activePageId}
        onSelectPage={(pageId) => {
          setPendientesOpen(false);
          selectPage(pageId);
        }}
        onSelectSection={(sectionId) => {
          setActiveSectionId(sectionId);
          setPendientesOpen(false);
          goHome();
        }}
        onNewPage={handleNewPage}
        className="sticky top-0 hidden h-full md:flex"
      />

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          activePage ? "overflow-y-auto" : "overflow-hidden",
        )}
      >
        <header className="sticky top-0 z-10 shrink-0 border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {activePage ? (
                  <span className="text-2xl leading-none" aria-hidden>
                    {activePage.icon}
                  </span>
                ) : (
                  <BookOpen className="h-6 w-6 shrink-0 text-slate-700" strokeWidth={1.75} />
                )}
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                  {activePage ? activePage.title : "Wiki"}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendientesOpen(false);
                  goHome();
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-800"
              >
                <Home className="h-3.5 w-3.5" />
                {activePage ? "Wiki" : "Inicio"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {canShowPendientes && (
                <Button
                  type="button"
                  variant={pendientesOpen ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => setPendientesOpen((open) => !open)}
                >
                  <ListTodo className="h-3.5 w-3.5" />
                  Pendientes
                </Button>
              )}
              <div id="wiki-zoom-slot" className="flex items-center" />
              <div className="relative w-full max-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={headerSearch}
                  onChange={(event) => setHeaderSearch(event.target.value)}
                  placeholder="Buscar"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "w-full min-h-0 flex-1",
            !activePage && "flex flex-col px-4 py-5 sm:px-6",
            activePage && "flex min-h-0 gap-0 px-0 py-0 sm:px-0",
          )}
        >
          {!activePage ? (
            <AnunciosWikiHomeEditor columns={homeBoard} onChange={setHomeBoard} />
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1">
              <div className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
                <AnunciosWikiPageView
                  page={activePage}
                  onTitleChange={(title) => setPageTitle(activePage.id, title)}
                  onViewTypeChange={(viewType) => setPageViewType(activePage.id, viewType)}
                  onAddKanbanColumn={() => addKanbanColumn(activePage.id, "Nueva columna")}
                  onAddKanbanCard={(columnId) =>
                    addKanbanCard(activePage.id, columnId, "Nueva tarjeta")
                  }
                  onKanbanChange={(columns) => setKanbanColumns(activePage.id, columns)}
                  onTableChange={(table) => setTable(activePage.id, table)}
                  onTodosChange={(todos) => setTodos(activePage.id, todos)}
                  onLinksChange={(links) => setLinks(activePage.id, links)}
                  onMuralChange={(columns) => setMuralColumns(activePage.id, columns)}
                  onBlocksChange={(blocks) => setBlocks(activePage.id, blocks)}
                />
              </div>
              {showPendientesSidebar && (
                <AnunciosWikiPendientesSidebar
                  pageTitle={activePage.title}
                  todos={activePage.todos}
                  onChange={(todos) => setTodos(activePage.id, todos)}
                  className="sticky top-0 hidden h-full lg:flex"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
