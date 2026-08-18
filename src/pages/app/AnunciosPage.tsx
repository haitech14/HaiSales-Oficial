import { useMemo, useState } from "react";
import { ListTodo } from "lucide-react";
import { AnunciosWikiHeader } from "@/components/app/anuncios/AnunciosWikiHeader";
import { AnunciosWikiHomeDashboard } from "@/components/app/anuncios/AnunciosWikiHomeDashboard";
import { AnunciosWikiPageView } from "@/components/app/anuncios/AnunciosWikiPageView";
import { AnunciosWikiPendientesSidebar } from "@/components/app/anuncios/AnunciosWikiPendientesSidebar";
import { AnunciosWikiRightSidebar } from "@/components/app/anuncios/AnunciosWikiRightSidebar";
import { AnunciosWikiSidebar } from "@/components/app/anuncios/AnunciosWikiSidebar";
import { Button } from "@/components/ui/button";
import { useWikiStore } from "@/hooks/useWikiStore";
import { wikiRecentPagesSeed } from "@/lib/anuncios/wiki-dashboard-data";
import { WIKI_MURAL_SIDEBAR_SECTIONS } from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

export default function AnunciosPage() {
  const {
    pages,
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
  } = useWikiStore();

  const [headerSearch, setHeaderSearch] = useState("");
  const [pendientesOpen, setPendientesOpen] = useState(false);

  const handleNewPage = () => {
    createPage(activeSectionId || "documentacion");
  };

  const handleSelectPage = (pageId: string) => {
    setPendientesOpen(false);
    selectPage(pageId);
  };

  const handleSelectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setPendientesOpen(false);
    goHome();
  };

  const canShowPendientes =
    !!activePage &&
    (WIKI_MURAL_SIDEBAR_SECTIONS as readonly string[]).includes(activePage.sectionId);
  const showPendientesSidebar = canShowPendientes && pendientesOpen;

  const recentPages = useMemo(() => {
    return wikiRecentPagesSeed.map((item) => {
      const page = pages.find((entry) => entry.id === item.pageId);
      if (!page) return item;
      return {
        ...item,
        title: page.title,
        updatedAt: page.updatedAt,
      };
    });
  }, [pages]);

  const filteredPageSearch = headerSearch.trim().toLowerCase();
  const searchMatchesPage =
    activePage &&
    filteredPageSearch &&
    (activePage.title.toLowerCase().includes(filteredPageSearch) ||
      activePage.tagLabel.toLowerCase().includes(filteredPageSearch));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]">
      <AnunciosWikiHeader
        search={headerSearch}
        onSearchChange={setHeaderSearch}
        onNewPage={handleNewPage}
        onGoHome={() => {
          setPendientesOpen(false);
          goHome();
        }}
        activePageTitle={activePage?.title ?? null}
      />

      <div className="flex min-h-0 flex-1">
        <AnunciosWikiSidebar
          activePageId={activePageId}
          activeSectionId={activeSectionId}
          onSelectPage={handleSelectPage}
          onSelectSection={handleSelectSection}
          onNewPage={handleNewPage}
          className="sticky top-0 hidden h-full md:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!activePage ? (
            <div className="flex min-h-0 flex-1">
              <AnunciosWikiHomeDashboard
                search={headerSearch}
                onSearchChange={setHeaderSearch}
                onSelectPage={handleSelectPage}
                recentPages={recentPages}
              />
              <AnunciosWikiRightSidebar
                onSelectPage={handleSelectPage}
                onSelectCategory={handleSelectSection}
              />
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-end gap-2 border-b border-slate-100 bg-white px-4 py-2 sm:px-6">
                {canShowPendientes && (
                  <Button
                    type="button"
                    variant={pendientesOpen ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setPendientesOpen((open) => !open)}
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    Pendientes
                  </Button>
                )}
                <div id="wiki-zoom-slot" className="flex items-center" />
              </div>

              <div className="flex min-h-0 min-w-0 flex-1">
                <div
                  className={cn(
                    "flex min-h-0 min-w-0 flex-1 overflow-hidden",
                    searchMatchesPage === false && filteredPageSearch && "opacity-40",
                  )}
                >
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
