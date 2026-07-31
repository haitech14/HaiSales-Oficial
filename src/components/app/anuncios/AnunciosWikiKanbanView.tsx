import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import {
  AnunciosWikiContextMenu,
  type WikiContextAction,
  type WikiContextMenuState,
} from "@/components/app/anuncios/AnunciosWikiContextMenu";
import { WikiWhatsAppTextarea } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createWikiId,
  reorderList,
  type WikiKanbanCard,
  type WikiKanbanColumn,
} from "@/lib/anuncios/wiki-store";
import { renderWhatsAppText } from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.75;
const ZOOM_STEP = 0.1;
const CARD_BASE_WIDTH = 300;
const CARD_BASE_HEIGHT = 140;
const CARD_WIDTH_MIN = 220;
const CARD_WIDTH_MAX = 640;
const CARD_HEIGHT_MIN = 88;
const CARD_HEIGHT_MAX = 640;
const COLUMN_MIN_WIDTH = 340;

type AnunciosWikiKanbanViewProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
  onAddColumn: () => void;
  onAddCard: (columnId: string) => void;
  /** Tablero enmarcado con fondo oscuro (mockup home) */
  framed?: boolean;
  /** Oculta la barra superior (cuando hay toolbar lateral) */
  hideChrome?: boolean;
};

type DragState = { columnId: string; index: number };

function cardBody(card: WikiKanbanCard) {
  return (card.note ?? "").trim() || card.title;
}

function cardWidth(card: WikiKanbanCard) {
  if (typeof card.width === "number") return card.width;
  if (typeof card.scale === "number") return Math.round(CARD_BASE_WIDTH * card.scale);
  return CARD_BASE_WIDTH;
}

function cardHeight(card: WikiKanbanCard) {
  if (typeof card.height === "number") return card.height;
  return CARD_BASE_HEIGHT;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function MockupCard({
  card,
  columnId,
  cardIndex,
  dragState,
  overState,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onUpdate,
  onRemove,
  onContextMenu,
}: {
  card: WikiKanbanCard;
  columnId: string;
  cardIndex: number;
  dragState: DragState | null;
  overState: DragState | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onUpdate: (updater: (card: WikiKanbanCard) => WikiKanbanCard) => void;
  onRemove: () => void;
  onContextMenu: (event: ReactMouseEvent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const body = cardBody(card);
  const tooltipTitle = card.title.trim() || "Sin título";
  const width = cardWidth(card);
  const height = cardHeight(card);

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: width,
      startH: height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      if (!resizeRef.current) return;
      const nextW = clamp(
        resizeRef.current.startW + (moveEvent.clientX - resizeRef.current.startX),
        CARD_WIDTH_MIN,
        CARD_WIDTH_MAX,
      );
      const nextH = clamp(
        resizeRef.current.startH + (moveEvent.clientY - resizeRef.current.startY),
        CARD_HEIGHT_MIN,
        CARD_HEIGHT_MAX,
      );
      onUpdate((item) => ({ ...item, width: nextW, height: nextH, scale: undefined }));
    };

    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-wiki-block="card"
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu(event);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop();
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border border-slate-300 bg-white",
        card.locked && "ring-1 ring-amber-300/70",
        dragState?.columnId === columnId && dragState.index === cardIndex && "opacity-50",
        overState?.columnId === columnId &&
          overState.index === cardIndex &&
          dragState &&
          "ring-2 ring-slate-400",
      )}
      style={{ width, height }}
    >
      <button
        type="button"
        draggable={!card.locked}
        disabled={card.locked}
        className="absolute left-1 top-1 z-10 cursor-grab rounded bg-white/90 p-0.5 text-slate-400 opacity-0 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 active:cursor-grabbing group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
        aria-label="Arrastrar tarjeta"
        title={card.locked ? "Posición bloqueada" : "Arrastrar"}
        onDragStart={(event) => {
          if (card.locked) {
            event.preventDefault();
            return;
          }
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", card.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
      >
        <GripVertical className="pointer-events-none h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 z-10 rounded bg-white/90 p-0.5 text-slate-300 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
        aria-label="Eliminar tarjeta"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div
        data-card-scroll
        className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3.5"
        draggable={false}
      >
        {editing ? (
          <div className="space-y-2">
            <WikiWhatsAppTextarea
              value={body}
              onChange={(note) =>
                onUpdate((item) => ({
                  ...item,
                  note,
                  title:
                    item.title ||
                    note.split("\n")[0]?.replace(/\*/g, "").slice(0, 80) ||
                    "Tarjeta",
                }))
              }
              rows={6}
              hideEmojiPicker
              showPreview={false}
              placeholder="Escribe el contenido de la tarjeta…"
              inputClassName="min-h-[100px] resize-none border-0 bg-transparent px-0 py-0 text-[13px] leading-[1.65] shadow-none focus:border-transparent focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
            >
              Listo
            </button>
          </div>
        ) : (
          <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full whitespace-pre-wrap text-left text-[13px] leading-[1.65] text-slate-800"
              >
                {body ? (
                  renderWhatsAppText(body)
                ) : (
                  <span className="text-slate-400">Escribe aquí…</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} className="max-w-xs font-medium">
              {tooltipTitle}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <button
        type="button"
        aria-label="Redimensionar tarjeta"
        title="Arrastra para cambiar el tamaño (el texto no cambia)"
        onPointerDown={handleResizePointerDown}
        className="absolute bottom-0.5 right-0.5 z-10 flex h-4 w-4 cursor-se-resize items-end justify-end p-0.5 text-slate-400 opacity-0 transition hover:text-slate-700 group-hover:opacity-100"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="block">
          <path d="M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 5 L5 9" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  );
}

export function AnunciosWikiKanbanView({
  columns,
  onChange,
  onAddColumn,
  onAddCard,
  framed = false,
  hideChrome = false,
}: AnunciosWikiKanbanViewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [overState, setOverState] = useState<DragState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<WikiContextMenuState | null>(null);
  const [zoomSlot, setZoomSlot] = useState<HTMLElement | null>(null);
  const clipboardRef = useRef<WikiKanbanCard | null>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useLayoutEffect(() => {
    setZoomSlot(document.getElementById("wiki-zoom-slot"));
  }, []);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      setContentSize({
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns]);

  const clampZoom = (value: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const canElementScrollY = (node: HTMLElement, deltaY: number) => {
      if (node.scrollHeight <= node.clientHeight + 1) return false;
      if (deltaY > 0) return node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if (deltaY < 0) return node.scrollTop > 0;
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      // Shift + rueda → desplazamiento horizontal del lienzo
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        el.scrollLeft += event.deltaY;
        return;
      }

      // Si el cursor está sobre una tarjeta con overflow, dejar scroll interno
      const target = event.target as HTMLElement | null;
      const nested = target?.closest?.("[data-card-scroll]") as HTMLElement | null;
      if (nested && canElementScrollY(nested, event.deltaY)) {
        return;
      }

      // Rueda arriba/abajo → zoom in / zoom out
      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(clampZoom(zoomRef.current + direction));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const updateCard = (
    columnId: string,
    cardId: string,
    updater: (card: WikiKanbanCard) => WikiKanbanCard,
  ) => {
    onChange(
      columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card.id === cardId ? updater(card) : card,
              ),
            }
          : column,
      ),
    );
  };

  const removeCard = (columnId: string, cardId: string) => {
    onChange(
      columns.map((column) =>
        column.id === columnId
          ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
          : column,
      ),
    );
  };

  const placeContextMenu = (
    event: ReactMouseEvent,
    payload: Omit<WikiContextMenuState, "x" | "y" | "mode" | "anchor">,
    anchorEl: HTMLElement,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 260;
    const menuHeight = 420;
    const x = Math.min(Math.max(8, event.clientX), window.innerWidth - menuWidth - 8);
    const y = Math.min(Math.max(8, event.clientY), window.innerHeight - menuHeight - 8);
    setContextMenu({
      ...payload,
      mode: "free",
      x,
      y,
      anchor: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  const openCardContextMenu = (
    event: ReactMouseEvent,
    columnId: string,
    card: WikiKanbanCard,
  ) => {
    const block =
      (event.currentTarget as HTMLElement | null)?.closest?.("[data-wiki-block='card']") ??
      (event.target as HTMLElement | null)?.closest?.("[data-wiki-block='card']");
    if (!block) return;
    placeContextMenu(
      event,
      {
        target: "card",
        columnId,
        cardId: card.id,
        cardTitle: card.title,
        locked: card.locked,
      },
      block as HTMLElement,
    );
  };

  const openColumnContextMenu = (event: ReactMouseEvent, column: WikiKanbanColumn) => {
    // Si el click fue sobre un bloque/tarjeta, lo maneja el menú del bloque
    if ((event.target as HTMLElement).closest("[data-wiki-block='card']")) return;
    const block = event.currentTarget as HTMLElement;
    placeContextMenu(
      event,
      {
        target: "column",
        columnId: column.id,
        cardTitle: column.title,
      },
      block,
    );
  };

  const handleContextAction = (action: WikiContextAction, menuSnapshot: WikiContextMenuState) => {
    const { columnId, cardId, target } = menuSnapshot;
    const currentColumns = columnsRef.current;
    const column = currentColumns.find((item) => item.id === columnId);
    if (!column) {
      setContextMenu(null);
      return;
    }

    if (target === "column") {
      if (action === "rename") {
        const next = window.prompt("Renombrar columna", column.title);
        if (next?.trim()) {
          onChange(
            currentColumns.map((item) =>
              item.id === columnId ? { ...item, title: next.trim() } : item,
            ),
          );
        }
      } else if (action === "duplicate") {
        const columnIndex = currentColumns.findIndex((item) => item.id === columnId);
        const cloneColumn: WikiKanbanColumn = {
          ...column,
          id: createWikiId("col"),
          title: column.title,
          cards: column.cards.map((card) => ({
            ...card,
            id: createWikiId("kcard"),
            locked: false,
          })),
        };
        const nextColumns = [...currentColumns];
        nextColumns.splice(columnIndex >= 0 ? columnIndex + 1 : nextColumns.length, 0, cloneColumn);
        onChange(nextColumns);
      } else if (action === "trash") {
        if (currentColumns.length > 1) {
          onChange(currentColumns.filter((item) => item.id !== columnId));
        }
      } else if (action === "copy") {
        void navigator.clipboard?.writeText?.(
          column.cards.map((card) => cardBody(card)).join("\n\n---\n\n"),
        );
      } else if (action === "toBoard") {
        onChange([
          ...currentColumns,
          {
            id: createWikiId("col"),
            title: `${column.title} · tablero`,
            color: "border-t-slate-300",
            countLabel: "tarjetas",
            cards: [],
          },
        ]);
      }
      setContextMenu(null);
      return;
    }

    const card = column.cards.find((item) => item.id === cardId);
    if (!card || !cardId) {
      setContextMenu(null);
      return;
    }

    if (action === "copy" || action === "cut") {
      clipboardRef.current = { ...card };
      void navigator.clipboard?.writeText?.(cardBody(card));
      if (action === "cut") {
        onChange(
          currentColumns.map((item) =>
            item.id === columnId
              ? { ...item, cards: item.cards.filter((entry) => entry.id !== cardId) }
              : item,
          ),
        );
      }
      setContextMenu(null);
      return;
    }

    if (action === "duplicate") {
      const index = column.cards.findIndex((item) => item.id === cardId);
      const clone: WikiKanbanCard = {
        ...card,
        id: createWikiId("kcard"),
        locked: false,
      };
      onChange(
        currentColumns.map((item) => {
          if (item.id !== columnId) return item;
          const cards = [...item.cards];
          // Siempre insertar la copia justo debajo del bloque original
          const insertAt = index >= 0 ? index + 1 : cards.length;
          cards.splice(insertAt, 0, clone);
          return { ...item, cards };
        }),
      );
      setContextMenu(null);
      return;
    }

    if (action === "trash") {
      onChange(
        currentColumns.map((item) =>
          item.id === columnId
            ? { ...item, cards: item.cards.filter((entry) => entry.id !== cardId) }
            : item,
        ),
      );
      setContextMenu(null);
      return;
    }

    if (action === "rename") {
      const next = window.prompt("Renombrar tarjeta", card.title);
      if (next?.trim()) {
        updateCard(columnId, cardId, (item) => ({ ...item, title: next.trim() }));
      }
      setContextMenu(null);
      return;
    }

    if (action === "lock") {
      updateCard(columnId, cardId, (item) => ({ ...item, locked: !item.locked }));
      setContextMenu((current) =>
        current ? { ...current, locked: !current.locked, cardTitle: card.title } : current,
      );
      return;
    }

    if (action === "bringFront" || action === "sendBack") {
      const index = column.cards.findIndex((item) => item.id === cardId);
      const targetIndex = action === "bringFront" ? column.cards.length - 1 : 0;
      onChange(
        currentColumns.map((item) =>
          item.id === columnId
            ? { ...item, cards: reorderList(item.cards, index, targetIndex) }
            : item,
        ),
      );
      setContextMenu(null);
      return;
    }

    if (action === "toBoard") {
      onChange([
        ...currentColumns,
        {
          id: createWikiId("col"),
          title: card.title || "Nuevo tablero",
          color: "border-t-slate-300",
          countLabel: "tarjetas",
          cards: [
            {
              ...card,
              id: createWikiId("kcard"),
              locked: false,
            },
          ],
        },
      ]);
      setContextMenu(null);
    }
  };

  const moveCard = (from: DragState, to: DragState) => {
    if (from.columnId === to.columnId) {
      onChange(
        columns.map((column) =>
          column.id === from.columnId
            ? { ...column, cards: reorderList(column.cards, from.index, to.index) }
            : column,
        ),
      );
      return;
    }

    const source = columns.find((column) => column.id === from.columnId);
    const moving = source?.cards[from.index];
    if (!moving) return;

    onChange(
      columns.map((column) => {
        if (column.id === from.columnId) {
          return {
            ...column,
            cards: column.cards.filter((_, index) => index !== from.index),
          };
        }
        if (column.id === to.columnId) {
          const next = [...column.cards];
          next.splice(to.index, 0, moving);
          return { ...column, cards: next };
        }
        return column;
      }),
    );
  };

  const dropOnColumnEnd = (columnId: string) => {
    if (!dragState) return;
    const target = columns.find((column) => column.id === columnId);
    if (!target) return;
    moveCard(dragState, { columnId, index: target.cards.length });
    setDragState(null);
    setOverState(null);
  };

  const columnsRow = (
    <div className="flex w-max items-start gap-5 p-5">
      {columns.map((column) => {
        return (
          <div
            key={column.id}
            data-wiki-block="column"
            className="flex shrink-0 flex-col rounded-sm border border-slate-200 bg-white px-3.5 pb-3.5 pt-5"
            style={{
              width: Math.max(
                COLUMN_MIN_WIDTH,
                ...column.cards.map((card) => cardWidth(card) + 28),
                COLUMN_MIN_WIDTH,
              ),
            }}
            onContextMenu={(event) => openColumnContextMenu(event, column)}
            onDragOver={(event) => {
              event.preventDefault();
              if (column.cards.length === 0) {
                setOverState({ columnId: column.id, index: 0 });
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (column.cards.length === 0 && dragState) {
                moveCard(dragState, { columnId: column.id, index: 0 });
                setDragState(null);
                setOverState(null);
              }
            }}
          >
            <div className="mb-5 text-center">
              <input
                  className="w-full bg-transparent text-center text-lg font-bold leading-tight tracking-tight text-slate-900 outline-none placeholder:text-slate-400"
                style={{ fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif' }}
                value={column.title}
                onChange={(event) =>
                  onChange(
                    columns.map((item) =>
                      item.id === column.id
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Columna"
                aria-label="Título de la columna"
              />
            </div>

            <div className="space-y-3">
              {column.cards.map((card, cardIndex) => (
                <MockupCard
                  key={card.id}
                  card={card}
                  columnId={column.id}
                  cardIndex={cardIndex}
                  dragState={dragState}
                  overState={overState}
                  onDragStart={() => setDragState({ columnId: column.id, index: cardIndex })}
                  onDragEnd={() => {
                    setDragState(null);
                    setOverState(null);
                  }}
                  onDragOver={() => setOverState({ columnId: column.id, index: cardIndex })}
                  onDrop={() => {
                    if (!dragState) return;
                    moveCard(dragState, { columnId: column.id, index: cardIndex });
                    setDragState(null);
                    setOverState(null);
                  }}
                  onUpdate={(updater) => updateCard(column.id, card.id, updater)}
                  onRemove={() => removeCard(column.id, card.id)}
                  onContextMenu={(event) => openCardContextMenu(event, column.id, card)}
                />
              ))}

              <div
                className="min-h-[8px]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOnColumnEnd(column.id);
                }}
              />

              <button
                type="button"
                onClick={() => onAddCard(column.id)}
                className="flex w-full items-center justify-center gap-1 rounded-sm px-1 py-1.5 text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar tarjeta
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const zoomControls = (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
        disabled={zoom <= ZOOM_MIN}
        aria-label="Reducir zoom"
        title="Reducir"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="min-w-[3.5rem] px-1 text-center text-[12px] font-semibold tabular-nums text-slate-700"
        onClick={() => setZoom(1)}
        title="Restablecer 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
        disabled={zoom >= ZOOM_MAX}
        aria-label="Ampliar zoom"
        title="Ampliar"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-[#e8ebf0]",
        framed && !hideChrome && "-mx-4 -my-5 sm:-mx-6",
        !framed && "-mx-3 sm:-mx-4",
      )}
    >
      {zoomSlot ? createPortal(zoomControls, zoomSlot) : (
        <div className="relative z-20 flex shrink-0 items-center justify-end gap-2 px-3 py-2.5">
          {zoomControls}
        </div>
      )}

      {!hideChrome && (
        <div className="relative z-20 flex shrink-0 items-center justify-end px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-slate-400/70 bg-white text-xs"
            onClick={onAddColumn}
          >
            <Plus className="h-3.5 w-3.5" />
            Columna
          </Button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="scrollbar-minimal min-h-0 flex-1 overflow-auto overscroll-contain"
        aria-label="Lienzo del tablero"
        onContextMenu={(event) => {
          // Evita el menú nativo del navegador en el lienzo
          if ((event.target as HTMLElement).closest("[data-card-scroll], .group")) return;
          event.preventDefault();
        }}
      >
        <div
          style={{
            width: Math.max(contentSize.width * zoom, 0),
            height: Math.max(contentSize.height * zoom, 0),
          }}
        >
          <div
            ref={contentRef}
            className="origin-top-left"
            style={{
              transform: `scale(${zoom})`,
              width: "max-content",
            }}
          >
            {columnsRow}
          </div>
        </div>
      </div>

      {contextMenu && (
        <AnunciosWikiContextMenu
          menu={contextMenu}
          onChangePosition={(next) =>
            setContextMenu((current) => (current ? { ...current, ...next } : current))
          }
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
