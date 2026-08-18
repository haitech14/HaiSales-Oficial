import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createWikiPage,
  getWikiSeedPage,
  loadMuralApuntesBoard,
  loadWikiPages,
  saveHomeBoard,
  saveWikiPages,
  wikiNavSections,
  type WikiDocBlock,
  type WikiKanbanCard,
  type WikiKanbanColumn,
  type WikiLinkItem,
  type WikiMuralColumn,
  type WikiPage,
  type WikiTodoItem,
  type WikiViewType,
} from "@/lib/anuncios/wiki-store";

function touch(page: WikiPage): WikiPage {
  return {
    ...page,
    updatedAt: new Date().toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function useWikiStore() {
  const [pages, setPages] = useState<WikiPage[]>(() => loadWikiPages());
  const [homeBoard, setHomeBoardState] = useState<WikiKanbanColumn[]>(() => loadMuralApuntesBoard());
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("documentacion");

  useEffect(() => {
    saveWikiPages(pages);
  }, [pages]);

  useEffect(() => {
    saveHomeBoard(homeBoard);
  }, [homeBoard]);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? null,
    [activePageId, pages],
  );

  const updatePage = useCallback((pageId: string, updater: (page: WikiPage) => WikiPage) => {
    setPages((current) =>
      current.map((page) => (page.id === pageId ? touch(updater(page)) : page)),
    );
  }, []);

  const selectPage = useCallback((pageId: string | null) => {
    if (!pageId) {
      setActivePageId(null);
      return;
    }

    setPages((current) => {
      if (current.some((page) => page.id === pageId)) return current;
      const seed = getWikiSeedPage(pageId);
      return seed ? [...current, seed] : current;
    });

    setActivePageId(pageId);
    const known =
      pages.find((item) => item.id === pageId) ?? getWikiSeedPage(pageId);
    if (known) setActiveSectionId(known.sectionId);
  }, [pages]);

  const goHome = useCallback(() => {
    setActivePageId(null);
  }, []);

  const createPage = useCallback(
    (sectionId?: string) => {
      const targetSection = sectionId || activeSectionId || "documentacion";
      const page = createWikiPage({
        sectionId: targetSection,
        title: "Nueva página",
      });
      setPages((current) => [page, ...current]);
      setActiveSectionId(targetSection);
      setActivePageId(page.id);
      return page;
    },
    [activeSectionId],
  );

  const setPageTitle = useCallback(
    (pageId: string, title: string) => {
      updatePage(pageId, (page) => ({ ...page, title }));
    },
    [updatePage],
  );

  const setPageViewType = useCallback(
    (pageId: string, viewType: WikiViewType) => {
      updatePage(pageId, (page) => ({ ...page, viewType }));
    },
    [updatePage],
  );

  const setKanbanColumns = useCallback(
    (pageId: string, kanbanColumns: WikiKanbanColumn[]) => {
      updatePage(pageId, (page) => ({ ...page, kanbanColumns }));
    },
    [updatePage],
  );

  const addKanbanCard = useCallback(
    (pageId: string, columnId: string, title: string) => {
      updatePage(pageId, (page) => ({
        ...page,
        kanbanColumns: page.kanbanColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cards: [
                  ...column.cards,
                  {
                    id: `kcard-${Date.now()}`,
                    title: title.trim() || "Nueva tarjeta",
                    note: "Escribe aquí… Usa *negrita* y emojis 👋",
                  },
                ],
              }
            : column,
        ),
      }));
    },
    [updatePage],
  );

  const addKanbanColumn = useCallback(
    (pageId: string, title: string) => {
      updatePage(pageId, (page) => ({
        ...page,
        kanbanColumns: [
          ...page.kanbanColumns,
          {
            id: `col-${Date.now()}`,
            title: title.trim() || "Nueva columna",
            color: "border-t-amber-500",
            countLabel: "tarjetas",
            cards: [] as WikiKanbanCard[],
          },
        ],
      }));
    },
    [updatePage],
  );

  const setTable = useCallback(
    (pageId: string, table: WikiPage["table"]) => {
      updatePage(pageId, (page) => ({ ...page, table }));
    },
    [updatePage],
  );

  const setTodos = useCallback(
    (pageId: string, todos: WikiTodoItem[]) => {
      updatePage(pageId, (page) => ({ ...page, todos }));
    },
    [updatePage],
  );

  const setLinks = useCallback(
    (pageId: string, links: WikiLinkItem[]) => {
      updatePage(pageId, (page) => ({ ...page, links }));
    },
    [updatePage],
  );

  const setMuralColumns = useCallback(
    (pageId: string, muralColumns: WikiMuralColumn[]) => {
      updatePage(pageId, (page) => ({ ...page, muralColumns }));
    },
    [updatePage],
  );

  const setBlocks = useCallback(
    (pageId: string, blocks: WikiDocBlock[]) => {
      updatePage(pageId, (page) => ({ ...page, blocks }));
    },
    [updatePage],
  );

  const setHomeBoard = useCallback((columns: WikiKanbanColumn[]) => {
    setHomeBoardState(columns);
  }, []);

  const navSections = useMemo(() => {
    return wikiNavSections.map((section) => ({
      ...section,
      items: pages
        .filter((page) => page.sectionId === section.id)
        .map((page) => ({ id: page.id, label: page.title, icon: page.icon })),
    }));
  }, [pages]);

  return {
    pages,
    homeBoard,
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
    setKanbanColumns,
    addKanbanCard,
    addKanbanColumn,
    setTable,
    setTodos,
    setLinks,
    setMuralColumns,
    setBlocks,
    setHomeBoard,
  };
}
