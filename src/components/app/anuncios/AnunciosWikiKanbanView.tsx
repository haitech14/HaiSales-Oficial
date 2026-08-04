import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
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
import type { WikiPlaceToolId } from "@/components/app/anuncios/AnunciosWikiBoardToolbar";
import {
  createWikiId,
  type WikiConnector,
  type WikiConnectorAnchor,
  type WikiKanbanCard,
  type WikiKanbanColumn,
  type WikiShapeType,
} from "@/lib/anuncios/wiki-store";
import { renderWhatsAppText } from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

const SHAPE_FILL_COLORS = [
  { hex: "#ffffff", label: "Blanco" },
  { hex: "#fef3c7", label: "Ámbar" },
  { hex: "#dbeafe", label: "Azul claro" },
  { hex: "#93c5fd", label: "Azul" },
  { hex: "#bbf7d0", label: "Verde" },
  { hex: "#fecaca", label: "Rojo" },
  { hex: "#e9d5ff", label: "Violeta" },
  { hex: "#e2e8f0", label: "Gris" },
] as const;

const SHAPE_STROKE_COLORS = [
  { hex: "#2563eb", label: "Azul" },
  { hex: "#0f172a", label: "Negro" },
  { hex: "#16a34a", label: "Verde" },
  { hex: "#dc2626", label: "Rojo" },
  { hex: "#ea580c", label: "Naranja" },
  { hex: "#7c3aed", label: "Violeta" },
  { hex: "#64748b", label: "Gris" },
  { hex: "#ffffff", label: "Blanco" },
] as const;

const SHAPE_BORDER_WIDTHS = [
  { value: 1, label: "Fino" },
  { value: 2.5, label: "Medio" },
  { value: 4, label: "Grueso" },
  { value: 6, label: "Extra" },
] as const;

type FreeDragState =
  | {
      kind: "card";
      columnId: string;
      cardId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      originX: number;
      originY: number;
      moved: boolean;
    }
  | {
      kind: "column";
      columnId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      originX: number;
      originY: number;
      cardOrigins: { id: string; x: number; y: number }[];
      moved: boolean;
    };

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
const COLUMN_GAP = 20;
const COLUMN_PAD_X = 14;
const COLUMN_PAD_TOP = 20;
const COLUMN_HEADER_H = 48;
const CARD_STACK_GAP = 12;
const CANVAS_PAD = 20;

type AnunciosWikiKanbanViewProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
  onAddColumn: () => void;
  onAddCard: (columnId: string) => void;
  /** Inicia un lote de historial (arrastre / resize = 1 deshacer) */
  onHistoryBatchStart?: () => void;
  onHistoryBatchEnd?: () => void;
  /** Tablero enmarcado con fondo oscuro (mockup home) */
  framed?: boolean;
  /** Oculta la barra superior (cuando hay toolbar lateral) */
  hideChrome?: boolean;
  /** Herramienta activa para colocar formas/texto en el lienzo */
  placeTool?: WikiPlaceToolId | null;
  onPlace?: (rect: { x: number; y: number; width: number; height: number }) => void;
  onCancelPlace?: () => void;
  /** Modo conectar: clic en A y luego en B crea una flecha */
  connectMode?: boolean;
  onCancelConnect?: () => void;
};

type CardRect = { x: number; y: number; w: number; h: number };

function collectConnectors(columns: WikiKanbanColumn[]): WikiConnector[] {
  return columns.flatMap((column) => column.connectors ?? []);
}

function connectorHostId(columns: WikiKanbanColumn[]): string | null {
  return (
    columns.find((column) => column.hideShell)?.id ??
    columns[0]?.id ??
    null
  );
}

/** Anclas de conexión en esquinas (y lados, para enganchar mejor). */
const SHAPE_CONNECT_ANCHORS = [
  { key: "tl", x: 0, y: 0, label: "Esquina superior izquierda" },
  { key: "tr", x: 1, y: 0, label: "Esquina superior derecha" },
  { key: "bl", x: 0, y: 1, label: "Esquina inferior izquierda" },
  { key: "br", x: 1, y: 1, label: "Esquina inferior derecha" },
  { key: "tm", x: 0.5, y: 0, label: "Arriba" },
  { key: "bm", x: 0.5, y: 1, label: "Abajo" },
  { key: "ml", x: 0, y: 0.5, label: "Izquierda" },
  { key: "mr", x: 1, y: 0.5, label: "Derecha" },
] as const satisfies readonly {
  key: WikiConnectorAnchor;
  x: number;
  y: number;
  label: string;
}[];

function anchorPoint(rect: CardRect, key?: WikiConnectorAnchor | null) {
  const anchor =
    SHAPE_CONNECT_ANCHORS.find((item) => item.key === key) ??
    SHAPE_CONNECT_ANCHORS.find((item) => item.key === "mr")!;
  return {
    x: rect.x + anchor.x * rect.w,
    y: rect.y + anchor.y * rect.h,
  };
}

/** Ancla más cercana a un punto (engancha la flecha al conector). */
function nearestAnchor(rect: CardRect, x: number, y: number): WikiConnectorAnchor {
  let best: WikiConnectorAnchor = "mr";
  let bestDist = Number.POSITIVE_INFINITY;
  for (const anchor of SHAPE_CONNECT_ANCHORS) {
    const px = rect.x + anchor.x * rect.w;
    const py = rect.y + anchor.y * rect.h;
    const dist = (px - x) ** 2 + (py - y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = anchor.key;
    }
  }
  return best;
}

/** Par de anclas más cercanas entre dos bloques. */
function bestAnchorPair(
  from: CardRect,
  to: CardRect,
): { fromAnchor: WikiConnectorAnchor; toAnchor: WikiConnectorAnchor } {
  let best = {
    fromAnchor: "mr" as WikiConnectorAnchor,
    toAnchor: "ml" as WikiConnectorAnchor,
  };
  let bestDist = Number.POSITIVE_INFINITY;
  for (const a of SHAPE_CONNECT_ANCHORS) {
    for (const b of SHAPE_CONNECT_ANCHORS) {
      const p1x = from.x + a.x * from.w;
      const p1y = from.y + a.y * from.h;
      const p2x = to.x + b.x * to.w;
      const p2y = to.y + b.y * to.h;
      const dist = (p1x - p2x) ** 2 + (p1y - p2y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { fromAnchor: a.key, toAnchor: b.key };
      }
    }
  }
  return best;
}

function connectorEndpoints(
  from: CardRect,
  to: CardRect,
  connector: WikiConnector,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  if (connector.fromAnchor && connector.toAnchor) {
    return {
      start: anchorPoint(from, connector.fromAnchor),
      end: anchorPoint(to, connector.toAnchor),
    };
  }
  if (connector.fromAnchor) {
    const start = anchorPoint(from, connector.fromAnchor);
    return { start, end: anchorPoint(to, nearestAnchor(to, start.x, start.y)) };
  }
  if (connector.toAnchor) {
    const end = anchorPoint(to, connector.toAnchor);
    return { start: anchorPoint(from, nearestAnchor(from, end.x, end.y)), end };
  }
  const pair = bestAnchorPair(from, to);
  return {
    start: anchorPoint(from, pair.fromAnchor),
    end: anchorPoint(to, pair.toAnchor),
  };
}

type ConnectDragState = {
  fromCardId: string;
  fromAnchor: WikiConnectorAnchor;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  hoverCardId: string | null;
  hoverAnchor: WikiConnectorAnchor | null;
};

function pointInRect(x: number, y: number, rect: CardRect, pad = 4) {
  return (
    x >= rect.x - pad &&
    x <= rect.x + rect.w + pad &&
    y >= rect.y - pad &&
    y <= rect.y + rect.h + pad
  );
}

type PlaceDraft = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function normalizePlaceRect(draft: PlaceDraft) {
  const x = Math.min(draft.startX, draft.currentX);
  const y = Math.min(draft.startY, draft.currentY);
  const width = Math.abs(draft.currentX - draft.startX);
  const height = Math.abs(draft.currentY - draft.startY);
  return { x, y, width, height };
}

function defaultPlaceSize(tool: WikiPlaceToolId) {
  if (tool === "texto") return { width: 180, height: 40 };
  return { width: 140, height: 140 };
}

function isPaintNone(value?: string) {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === "none" || v === "transparent";
}

function ShapeSvg({
  shape,
  fill = "#93c5fd",
  stroke = "#2563eb",
  strokeWidth = 2.5,
  preview = false,
}: {
  shape: WikiShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  preview?: boolean;
}) {
  const opacity = preview ? 0.55 : 1;
  const fillNone = isPaintNone(fill);
  const strokeNone = isPaintNone(stroke) || strokeWidth <= 0;
  const border = Math.max(0, strokeWidth);
  const common = {
    fill: fillNone ? "none" : fill,
    stroke: strokeNone ? "none" : stroke,
    strokeWidth: strokeNone ? 0 : Math.max(1, border),
    vectorEffect: "non-scaling-stroke" as const,
    opacity,
  };

  // Rectángulo con radio en px (no se deforma al alargar)
  if (shape === "square") {
    return (
      <div
        aria-hidden
        className="h-full w-full rounded-[12px] border-solid"
        style={{
          backgroundColor: fillNone ? "transparent" : fill,
          borderColor: strokeNone ? "transparent" : stroke,
          borderWidth: strokeNone ? 0 : Math.max(1, border),
          opacity,
        }}
      />
    );
  }

  // preserveAspectRatio="none" permite alargar (círculo → elipse, etc.)
  if (shape === "circle") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <ellipse cx="50" cy="50" rx="44" ry="44" {...common} />
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <polygon points="50,8 94,90 6,90" {...common} />
      </svg>
    );
  }
  if (shape === "polygon") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" {...common} />
      </svg>
    );
  }
  return null;
}

function NoneSwatch({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative h-5 w-5 overflow-hidden rounded-full border border-slate-300 bg-white transition hover:scale-110",
        active && "ring-2 ring-blue-500 ring-offset-1",
      )}
    >
      <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_46%,#ef4444_46%,#ef4444_54%,transparent_54%)]" />
    </button>
  );
}

function ShapeStyleBar({
  anchorRef,
  fill,
  stroke,
  strokeWidth,
  onChange,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  fill: string;
  stroke: string;
  strokeWidth: number;
  onChange: (patch: { fill?: string; stroke?: string; strokeWidth?: number }) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const barHeight = barRef.current?.offsetHeight ?? 120;
    const gap = 10;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferTop = spaceAbove >= barHeight + gap || spaceAbove >= spaceBelow;
    const nextPlacement = preferTop ? "top" : "bottom";
    setPlacement(nextPlacement);
    setCoords({
      left: Math.min(
        Math.max(12, rect.left + rect.width / 2),
        window.innerWidth - 12,
      ),
      top: nextPlacement === "top" ? rect.top - gap : rect.bottom + gap,
    });
  };

  const open = () => {
    clearCloseTimer();
    updatePosition();
    setVisible(true);
    requestAnimationFrame(updatePosition);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setVisible(false), 140);
  };

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const onEnter = () => open();
    const onLeave = () => scheduleClose();

    anchor.addEventListener("mouseenter", onEnter);
    anchor.addEventListener("mouseleave", onLeave);
    return () => {
      anchor.removeEventListener("mouseenter", onEnter);
      anchor.removeEventListener("mouseleave", onLeave);
      clearCloseTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRef]);

  useEffect(() => {
    if (!visible) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, anchorRef]);

  if (!visible || typeof document === "undefined") return null;

  const fillNone = isPaintNone(fill);
  const strokeNone = isPaintNone(stroke);

  return createPortal(
    <div
      ref={barRef}
      data-no-drag
      data-shape-style-bar
      role="toolbar"
      aria-label="Estilo de forma"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="fixed z-[400] w-max"
      style={{
        left: coords.left,
        top: coords.top,
        transform:
          placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-xl shadow-slate-900/15">
        <div className="flex items-center gap-1.5">
          <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Relleno
          </span>
          <div className="flex items-center gap-1">
            <NoneSwatch
              active={fillNone}
              label="Sin relleno"
              onClick={() => onChange({ fill: "transparent" })}
            />
            {SHAPE_FILL_COLORS.map((color) => (
              <button
                key={`fill-${color.hex}`}
                type="button"
                title={`Relleno ${color.label}`}
                aria-label={`Relleno ${color.label}`}
                aria-pressed={!fillNone && fill.toLowerCase() === color.hex.toLowerCase()}
                onClick={() => onChange({ fill: color.hex })}
                className={cn(
                  "h-5 w-5 rounded-full border border-slate-300 transition hover:scale-110",
                  !fillNone &&
                    fill.toLowerCase() === color.hex.toLowerCase() &&
                    "ring-2 ring-blue-500 ring-offset-1",
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Borde
          </span>
          <div className="flex items-center gap-1">
            <NoneSwatch
              active={strokeNone}
              label="Sin borde"
              onClick={() => onChange({ stroke: "transparent", strokeWidth: 0 })}
            />
            {SHAPE_STROKE_COLORS.map((color) => (
              <button
                key={`stroke-${color.hex}`}
                type="button"
                title={`Borde ${color.label}`}
                aria-label={`Borde ${color.label}`}
                aria-pressed={!strokeNone && stroke.toLowerCase() === color.hex.toLowerCase()}
                onClick={() =>
                  onChange({
                    stroke: color.hex,
                    strokeWidth: strokeWidth > 0 ? strokeWidth : 2.5,
                  })
                }
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white transition hover:scale-110",
                  !strokeNone &&
                    stroke.toLowerCase() === color.hex.toLowerCase() &&
                    "ring-2 ring-blue-500 ring-offset-1",
                )}
                style={{ borderColor: color.hex }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Grosor
          </span>
          <div className="flex items-center gap-1">
            {SHAPE_BORDER_WIDTHS.map((item) => (
              <button
                key={item.value}
                type="button"
                title={`Borde ${item.label}`}
                aria-label={`Grosor ${item.label}`}
                aria-pressed={
                  !strokeNone && Math.abs(strokeWidth - item.value) < 0.1
                }
                onClick={() =>
                  onChange({
                    strokeWidth: item.value,
                    stroke: strokeNone ? "#2563eb" : stroke,
                  })
                }
                className={cn(
                  "flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold transition",
                  !strokeNone && Math.abs(strokeWidth - item.value) < 0.1
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {item.label[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function shapeFromPlaceTool(tool: WikiPlaceToolId): WikiShapeType | null {
  if (tool === "cuadrado") return "square";
  if (tool === "circulo") return "circle";
  if (tool === "triangulo") return "triangle";
  if (tool === "poligono") return "polygon";
  return null;
}

function columnShellWidth(column: WikiKanbanColumn) {
  return Math.max(
    COLUMN_MIN_WIDTH,
    ...column.cards.map((card) => cardWidth(card) + COLUMN_PAD_X * 2),
    COLUMN_MIN_WIDTH,
  );
}

function columnOriginX(columns: WikiKanbanColumn[], columnIndex: number) {
  let x = CANVAS_PAD;
  for (let i = 0; i < columnIndex; i += 1) {
    if (columns[i]?.hideShell) continue;
    x += columnShellWidth(columns[i]) + COLUMN_GAP;
  }
  return x;
}

function columnPosition(
  columns: WikiKanbanColumn[],
  column: WikiKanbanColumn,
  columnIndex = columns.findIndex((item) => item.id === column.id),
): { x: number; y: number } {
  if (typeof column.x === "number" && typeof column.y === "number") {
    return { x: column.x, y: column.y };
  }
  return {
    x: columnOriginX(columns, Math.max(0, columnIndex)),
    y: CANVAS_PAD,
  };
}

function defaultCardPosition(
  columns: WikiKanbanColumn[],
  columnId: string,
  cardId: string,
): { x: number; y: number } {
  const columnIndex = columns.findIndex((column) => column.id === columnId);
  const column = columns[columnIndex];
  if (!column || columnIndex < 0) return { x: CANVAS_PAD, y: CANVAS_PAD };
  const colPos = columnPosition(columns, column, columnIndex);
  const cardIndex = column.cards.findIndex((card) => card.id === cardId);
  let y = colPos.y + COLUMN_PAD_TOP + COLUMN_HEADER_H + 12;
  for (let i = 0; i < Math.max(0, cardIndex); i += 1) {
    y += cardHeight(column.cards[i]) + CARD_STACK_GAP;
  }
  return {
    x: colPos.x + COLUMN_PAD_X,
    y,
  };
}

/** Tarjeta ligada al bloque (apilada dentro) vs libre en el lienzo. */
function isCardBoundToColumn(
  columns: WikiKanbanColumn[],
  column: WikiKanbanColumn,
  card: WikiKanbanCard,
): boolean {
  if (card.independent) return false;
  if (typeof card.x !== "number" || typeof card.y !== "number") return true;

  const colPos = columnPosition(columns, column);
  const colW = columnShellWidth(column);
  const frameH = Math.max(320, COLUMN_PAD_TOP + COLUMN_HEADER_H + 120);
  const cx = card.x + cardWidth(card) / 2;
  const cy = card.y + Math.min(40, cardHeight(card) / 2);

  return (
    cx >= colPos.x - 12 &&
    cx <= colPos.x + colW + 12 &&
    cy >= colPos.y - 12 &&
    cy <= colPos.y + frameH + 48
  );
}

function columnShellHeight(columns: WikiKanbanColumn[], column: WikiKanbanColumn) {
  const colPos = columnPosition(columns, column);
  let bottom = colPos.y + COLUMN_PAD_TOP + COLUMN_HEADER_H + 96;
  for (const card of column.cards) {
    if (!isCardBoundToColumn(columns, column, card)) continue;
    const pos = cardPosition(columns, column.id, card);
    bottom = Math.max(bottom, pos.y + cardHeight(card) + 56);
  }
  return Math.max(320, bottom - colPos.y);
}

function cardPosition(
  columns: WikiKanbanColumn[],
  columnId: string,
  card: WikiKanbanCard,
): { x: number; y: number } {
  if (typeof card.x === "number" && typeof card.y === "number") {
    return { x: card.x, y: card.y };
  }
  return defaultCardPosition(columns, columnId, card.id);
}

/** Texto editable: conserva espacios (no hacer trim). */
function cardNoteRaw(card: WikiKanbanCard) {
  return typeof card.note === "string" ? card.note : card.title;
}

/** Texto para copiar / menú: sí limpia extremos. */
function cardBody(card: WikiKanbanCard) {
  const raw = typeof card.note === "string" ? card.note : "";
  return raw.trim() || card.title;
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

/** Estima alto del bloque según texto (incluye líneas en blanco del pegado). */
function estimateCardHeightForNote(note: string, width: number) {
  const lineHeight = 13 * 1.65;
  const padY = 52;
  const innerWidth = Math.max(80, width - 28);
  const charsPerLine = Math.max(18, Math.floor(innerWidth / 7.4));
  let lines = 0;
  for (const line of note.replace(/\r\n/g, "\n").split("\n")) {
    if (line.length === 0) {
      lines += 1;
      continue;
    }
    lines += Math.max(1, Math.ceil(line.length / charsPerLine));
  }
  lines = Math.max(1, lines);
  return clamp(Math.ceil(lines * lineHeight + padY + 8), CARD_HEIGHT_MIN, CARD_HEIGHT_MAX);
}

/** Empuja las tarjetas de abajo cuando cambia el alto de una (mantiene el hueco). */
function reflowCardsAfterHeightChange(
  columns: WikiKanbanColumn[],
  columnId: string,
  cardId: string,
  newHeight: number,
): WikiKanbanColumn[] {
  const column = columns.find((item) => item.id === columnId);
  const card = column?.cards.find((item) => item.id === cardId);
  if (!column || !card) return columns;

  const pos = cardPosition(columns, columnId, card);
  const oldHeight = cardHeight(card);
  const delta = newHeight - oldHeight;
  if (delta === 0) {
    return columns.map((item) =>
      item.id !== columnId
        ? item
        : {
            ...item,
            cards: item.cards.map((entry) =>
              entry.id === cardId ? { ...entry, height: newHeight, x: pos.x, y: pos.y } : entry,
            ),
          },
    );
  }

  const oldBottom = pos.y + oldHeight;
  const resizedWidth = cardWidth(card);
  const resizedBound = isCardBoundToColumn(columns, column, card);

  return columns.map((item) => {
    if (item.id !== columnId) return item;
    return {
      ...item,
      cards: item.cards.map((entry) => {
        if (entry.id === cardId) {
          return { ...entry, height: newHeight, x: pos.x, y: pos.y };
        }
        // Solo reordena tarjetas ligadas al mismo bloque (no las independientes)
        if (!resizedBound || !isCardBoundToColumn(columns, column, entry)) {
          return entry;
        }
        const entryPos = cardPosition(columns, columnId, entry);
        const overlapsX =
          entryPos.x < pos.x + resizedWidth && entryPos.x + cardWidth(entry) > pos.x;
        if (overlapsX && entryPos.y >= oldBottom - 2) {
          return {
            ...entry,
            x: entryPos.x,
            y: Math.max(0, Math.round(entryPos.y + delta)),
          };
        }
        if (typeof entry.x !== "number" || typeof entry.y !== "number") {
          return { ...entry, x: entryPos.x, y: entryPos.y };
        }
        return entry;
      }),
    };
  });
}

function MockupCard({
  card,
  cardIndex,
  position,
  isDragging,
  suppressClick,
  connectMode,
  connectSelected,
  connectHover,
  onConnectPick,
  onConnectDragStart,
  onUpdate,
  onResize,
  onResizeStart,
  onResizeEnd,
  onNoteChange,
  onPasteNote,
  onRemove,
  onContextMenu,
  onFreeDragStart,
}: {
  card: WikiKanbanCard;
  cardIndex: number;
  position: { x: number; y: number };
  isDragging: boolean;
  suppressClick: boolean;
  connectMode?: boolean;
  connectSelected?: boolean;
  connectHover?: boolean;
  onConnectPick?: () => void;
  onConnectDragStart?: (
    event: ReactPointerEvent<HTMLButtonElement>,
    anchor: WikiConnectorAnchor,
    anchorX: number,
    anchorY: number,
  ) => void;
  onUpdate: (updater: (card: WikiKanbanCard) => WikiKanbanCard) => void;
  onResize: (width: number, height: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onNoteChange: (note: string) => void;
  onPasteNote: (note: string) => void;
  onRemove: () => void;
  onContextMenu: (event: ReactMouseEvent) => void;
  onFreeDragStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const cardRootRef = useRef<HTMLDivElement>(null);
  const shapeInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (suppressClick || connectMode) return;
    if (card.kind === "shape" || card.kind === "text") {
      setEditing(true);
      return;
    }
    // Ajusta el alto al contenido (sin recortar espacios del texto)
    onPasteNote(cardNoteRaw(card));
    setEditing(true);
  };

  useEffect(() => {
    if (editing && (card.kind === "shape" || card.kind === "text")) {
      shapeInputRef.current?.focus();
      shapeInputRef.current?.select();
    }
  }, [editing, card.kind]);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const body = cardNoteRaw(card);
  const tooltipTitle = card.title.trim() || "Sin título";
  const width = cardWidth(card);
  const height = cardHeight(card);

  useEffect(() => {
    if (!editing) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = cardRootRef.current;
      const target = event.target as HTMLElement | null;
      if (!root || !target) return;
      if (root.contains(target)) return;
      // Barra flotante de formato (portal en body)
      if (target.closest("[data-wa-format-toolbar], [data-shape-style-bar]")) return;
      setEditing(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(false);
    };

    // Diferir para no cerrar con el mismo click que abrió la edición
    const timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  const isShape = card.kind === "shape" && Boolean(card.shape);
  const isText = card.kind === "text";
  const minW = isShape || isText ? 48 : CARD_WIDTH_MIN;
  const maxW = isShape ? 480 : CARD_WIDTH_MAX;
  const minH = isShape || isText ? 32 : CARD_HEIGHT_MIN;
  const maxH = isShape ? 480 : CARD_HEIGHT_MAX;

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onResizeStart?.();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: width,
      startH: height,
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (!resizeRef.current) return;
      const nextW = clamp(
        resizeRef.current.startW + (moveEvent.clientX - resizeRef.current.startX),
        minW,
        maxW,
      );
      const nextH = clamp(
        resizeRef.current.startH + (moveEvent.clientY - resizeRef.current.startY),
        minH,
        maxH,
      );
      onResize(nextW, nextH);
    };

    const onUp = () => {
      resizeRef.current = null;
      onResizeEnd?.();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={cardRootRef}
      data-wiki-block="card"
      title={tooltipTitle}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu(event);
      }}
      onPointerDown={(event) => {
        if (connectMode) {
          event.preventDefault();
          event.stopPropagation();
          onConnectPick?.();
          return;
        }
        if (card.locked) return;
        const target = event.target as HTMLElement;
        if (target.closest("textarea, input, a, [data-no-drag]")) return;
        // En edición solo se mueve desde el asa; si no, desde cualquier parte del bloque
        if (editing && !target.closest("[data-card-drag-handle]")) return;
        onFreeDragStart(event);
      }}
      onDragStart={(event) => event.preventDefault()}
      className={cn(
        "group absolute flex flex-col select-none",
        isShape || isText
          ? "overflow-visible border-0 bg-transparent shadow-none"
          : "overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm",
        connectMode
          ? "cursor-crosshair"
          : card.locked
            ? "cursor-default ring-1 ring-amber-300/70"
            : "cursor-grab active:cursor-grabbing",
        isDragging && !isShape && !isText && "shadow-lg ring-2 ring-slate-400/50",
        isDragging && (isShape || isText) && "ring-2 ring-blue-400/40",
        (connectSelected || connectHover) && "ring-2 ring-blue-500 ring-offset-2",
      )}
      style={{
        width,
        height,
        left: position.x,
        top: position.y,
        zIndex: isDragging
          ? 200 + cardIndex
          : typeof card.z === "number"
            ? Math.max(20, card.z + 20)
            : 20 + cardIndex,
        touchAction: card.locked ? "auto" : "none",
      }}
    >
      <button
        type="button"
        data-card-drag-handle
        title="Arrastra para mover"
        aria-label="Mover bloque"
        onPointerDown={(event) => {
          if (card.locked) return;
          event.preventDefault();
          event.stopPropagation();
          onFreeDragStart(event);
        }}
        className={cn(
          "absolute left-1.5 top-1.5 z-20 cursor-grab rounded bg-white/95 p-1 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:cursor-grabbing",
          editing || isShape || isText ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        data-no-drag
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 z-10 rounded bg-white/95 p-0.5 text-slate-300 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {isShape && card.shape ? (
        <div className="relative h-full w-full" draggable={false}>
          {!connectMode && (
            <ShapeStyleBar
              anchorRef={cardRootRef}
              fill={card.fill ?? "#93c5fd"}
              stroke={card.stroke ?? "#2563eb"}
              strokeWidth={typeof card.strokeWidth === "number" ? card.strokeWidth : 2.5}
              onChange={(patch) => onUpdate((current) => ({ ...current, ...patch }))}
            />
          )}
          <ShapeSvg
            shape={card.shape}
            fill={card.fill}
            stroke={card.stroke}
            strokeWidth={card.strokeWidth}
          />
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
            {editing ? (
              <input
                ref={shapeInputRef}
                type="text"
                data-no-drag
                value={body}
                onChange={(event) => onNoteChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter" || event.key === "Escape") {
                    event.preventDefault();
                    setEditing(false);
                  }
                }}
                placeholder="Texto…"
                className="w-full min-w-0 rounded border-0 bg-white/85 px-2 py-1 text-center text-[12px] font-medium text-slate-800 outline-none ring-1 ring-blue-400/50"
              />
            ) : (
              <button
                type="button"
                tabIndex={0}
                data-no-drag
                onClick={(event) => {
                  event.stopPropagation();
                  if (connectMode) {
                    onConnectPick?.();
                    return;
                  }
                  startEditing();
                }}
                className="line-clamp-3 max-w-full whitespace-pre-wrap text-[12px] font-medium leading-snug text-slate-800"
              >
                {body.length > 0 ? body : null}
              </button>
            )}
          </div>

          {/* Anclas para arrastrar conectores desde esquinas / lados */}
          {!editing &&
            SHAPE_CONNECT_ANCHORS.map((anchor) => (
              <button
                key={anchor.key}
                type="button"
                data-no-drag
                data-connect-handle
                title={`Arrastra para conectar · ${anchor.label}`}
                aria-label={`Conectar desde ${anchor.label}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const ax = position.x + anchor.x * width;
                  const ay = position.y + anchor.y * height;
                  onConnectDragStart?.(event, anchor.key, ax, ay);
                }}
                className={cn(
                  "absolute z-30 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-sm transition",
                  "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:scale-125 hover:bg-blue-50",
                  // Esquina inferior derecha: no tapar del todo el resize
                  anchor.key === "br" && "z-[25]",
                )}
                style={{
                  left: `${anchor.x * 100}%`,
                  top: `${anchor.y * 100}%`,
                }}
              />
            ))}
        </div>
      ) : isText ? (
        <div
          data-card-scroll
          className={cn(
            "min-h-0 flex-1 px-1 py-1",
            editing ? "flex flex-col" : "",
          )}
          draggable={false}
        >
          {editing ? (
            <input
              ref={shapeInputRef}
              type="text"
              data-no-drag
              value={body}
              onChange={(event) => onNoteChange(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter" || event.key === "Escape") {
                  event.preventDefault();
                  setEditing(false);
                }
              }}
              placeholder="Escribe texto…"
              className="h-full min-h-[28px] w-full rounded border border-blue-300 bg-white/90 px-2 py-1 text-[15px] font-medium leading-snug text-slate-800 outline-none"
            />
          ) : (
            <button
              type="button"
              tabIndex={0}
              onClick={() => {
                if (connectMode) {
                  onConnectPick?.();
                  return;
                }
                startEditing();
              }}
              className={cn(
                "w-full whitespace-pre-wrap text-left text-[15px] font-medium leading-snug text-slate-800 outline-none",
                !body.trim() && "text-slate-400",
                connectMode
                  ? "cursor-crosshair"
                  : card.locked
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing",
              )}
            >
              {body.length > 0 ? body : "Texto"}
            </button>
          )}
        </div>
      ) : (
        <div
          data-card-scroll
          className={cn(
            "scrollbar-minimal min-h-0 flex-1 overflow-x-hidden px-4 pb-7 pt-8",
            editing ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
          draggable={false}
        >
          {editing ? (
            <div className="flex min-h-0 flex-1 flex-col" data-no-drag>
              <WikiWhatsAppTextarea
                value={body}
                onChange={onNoteChange}
                onPasteText={onPasteNote}
                rows={Math.max(8, body.split("\n").length + 2)}
                fillHeight
                hideEmojiPicker
                showPreview={false}
                placeholder=""
                inputClassName="h-full min-h-0 border-0 bg-transparent px-0 py-0 text-[13px] leading-[1.65] shadow-none focus:border-transparent focus:ring-0"
              />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={startEditing}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  startEditing();
                }
              }}
              className={cn(
                "w-full whitespace-pre-wrap text-left text-[13px] leading-[1.65] text-slate-800 outline-none",
                card.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
              )}
            >
              {body.length > 0 ? renderWhatsAppText(body) : null}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label="Redimensionar"
        title="Arrastra para alargar o cambiar el tamaño"
        data-no-drag
        onPointerDown={handleResizePointerDown}
        className={cn(
          "absolute z-40 flex cursor-se-resize items-end justify-end text-slate-500 transition hover:text-blue-600",
          isShape || isText
            ? "bottom-0 right-0 h-5 w-5 opacity-100"
            : "bottom-1.5 right-1.5 h-4 w-4 opacity-0 group-hover:opacity-100",
        )}
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
  onHistoryBatchStart,
  onHistoryBatchEnd,
  framed = false,
  hideChrome = false,
  placeTool = null,
  onPlace,
  onCancelPlace,
  connectMode = false,
  onCancelConnect,
}: AnunciosWikiKanbanViewProps) {
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<WikiContextMenuState | null>(null);
  const [zoomSlot, setZoomSlot] = useState<HTMLElement | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [suppressCardClick, setSuppressCardClick] = useState(false);
  const [placeDraft, setPlaceDraft] = useState<PlaceDraft | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [connectDrag, setConnectDrag] = useState<ConnectDragState | null>(null);
  const clipboardRef = useRef<WikiKanbanCard | null>(null);
  const columnsRef = useRef(columns);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const connectDragRef = useRef<ConnectDragState | null>(null);
  const freeDragRef = useRef<FreeDragState | null>(null);
  const placeDraftRef = useRef<PlaceDraft | null>(null);
  const placeToolRef = useRef(placeTool);
  placeToolRef.current = placeTool;
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const historyBatchStartRef = useRef(onHistoryBatchStart);
  historyBatchStartRef.current = onHistoryBatchStart;
  const historyBatchEndRef = useRef(onHistoryBatchEnd);
  historyBatchEndRef.current = onHistoryBatchEnd;

  useEffect(() => {
    if (!placeTool) {
      placeDraftRef.current = null;
      setPlaceDraft(null);
    }
  }, [placeTool]);

  useEffect(() => {
    if (!connectMode) setConnectFromId(null);
  }, [connectMode]);

  useEffect(() => {
    if (!placeTool && !connectMode && !connectDrag) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (connectDrag) {
        connectDragRef.current = null;
        setConnectDrag(null);
        return;
      }
      if (placeTool) onCancelPlace?.();
      if (connectMode) {
        if (connectFromId) setConnectFromId(null);
        else onCancelConnect?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placeTool, connectMode, connectDrag, connectFromId, onCancelPlace, onCancelConnect]);

  const clientToCanvas = (clientX: number, clientY: number) => {
    const content = contentRef.current;
    if (!content) return { x: 0, y: 0 };
    const rect = content.getBoundingClientRect();
    const z = zoomRef.current || 1;
    return {
      x: Math.max(0, (clientX - rect.left) / z),
      y: Math.max(0, (clientY - rect.top) / z),
    };
  };

  const beginPlaceDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!placeTool || connectMode) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-wiki-block], [data-wa-format-toolbar]")) return;

    event.preventDefault();
    event.stopPropagation();
    const point = clientToCanvas(event.clientX, event.clientY);
    const draft: PlaceDraft = {
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    };
    placeDraftRef.current = draft;
    setPlaceDraft(draft);

    const onMove = (moveEvent: PointerEvent) => {
      if (!placeDraftRef.current) return;
      const nextPoint = clientToCanvas(moveEvent.clientX, moveEvent.clientY);
      const next = {
        ...placeDraftRef.current,
        currentX: nextPoint.x,
        currentY: nextPoint.y,
      };
      placeDraftRef.current = next;
      setPlaceDraft(next);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const current = placeDraftRef.current;
      const tool = placeToolRef.current;
      placeDraftRef.current = null;
      setPlaceDraft(null);
      if (!current || !tool) return;

      const raw = normalizePlaceRect(current);
      const defaults = defaultPlaceSize(tool);
      const width = raw.width < 8 ? defaults.width : Math.max(tool === "texto" ? 80 : 48, raw.width);
      const height =
        raw.height < 8 ? defaults.height : Math.max(tool === "texto" ? 28 : 48, raw.height);
      onPlaceRef.current?.({
        x: Math.round(raw.x),
        y: Math.round(raw.y),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // No pisar el ref a mitad de un arrastre (evita perder tarjetas / posiciones)
  useEffect(() => {
    if (!freeDragRef.current) {
      columnsRef.current = columns;
    }
  }, [columns]);

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

    const findCardScroller = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) return null;
      if (!target.closest("[data-wiki-block='card']")) return null;

      const textarea = target.closest("textarea");
      if (textarea instanceof HTMLElement) return textarea;

      return target.closest("[data-card-scroll]");
    };

    const onWheel = (event: WheelEvent) => {
      // Ctrl / Cmd + rueda → zoom in / out
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(clampZoom(zoomRef.current + direction));
        return;
      }

      // Rueda sobre un bloque → scroll interno del bloque
      const scroller = findCardScroller(event.target);
      if (scroller) {
        event.preventDefault();
        event.stopPropagation();
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        if (maxScroll > 0) {
          scroller.scrollTop = Math.min(
            maxScroll,
            Math.max(0, scroller.scrollTop + event.deltaY),
          );
        }
        return;
      }

      // Rueda normal → desplazamiento del lienzo (Shift = horizontal)
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) {
        el.scrollLeft += event.deltaY !== 0 ? event.deltaY : event.deltaX;
      } else {
        el.scrollTop += event.deltaY;
        el.scrollLeft += event.deltaX;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = freeDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = (event.clientX - drag.startClientX) / zoomRef.current;
      const dy = (event.clientY - drag.startClientY) / zoomRef.current;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;

      event.preventDefault();
      let current = columnsRef.current;

      if (drag.kind === "column") {
        if (!drag.moved) {
          drag.moved = true;
          historyBatchStartRef.current?.();
          setDraggingColumnId(drag.columnId);
          // Solo fija/mueve tarjetas ligadas al bloque; las libres quedan independientes
          current = current.map((column, index) => {
            if (column.id !== drag.columnId) return column;
            const colPos = columnPosition(current, column, index);
            return {
              ...column,
              x: typeof column.x === "number" ? column.x : colPos.x,
              y: typeof column.y === "number" ? column.y : colPos.y,
              cards: column.cards.map((card) => {
                if (!isCardBoundToColumn(current, column, card)) {
                  return { ...card, independent: true };
                }
                const pos = cardPosition(current, column.id, card);
                return {
                  ...card,
                  independent: false,
                  x: typeof card.x === "number" ? card.x : pos.x,
                  y: typeof card.y === "number" ? card.y : pos.y,
                };
              }),
            };
          });
          const hydrated = current.find((item) => item.id === drag.columnId);
          if (hydrated) {
            drag.cardOrigins = hydrated.cards
              .filter((card) => isCardBoundToColumn(current, hydrated, card))
              .map((card) => ({
                id: card.id,
                x: card.x ?? 0,
                y: card.y ?? 0,
              }));
          }
        }

        const nextX = Math.max(0, Math.round(drag.originX + dx));
        const nextY = Math.max(0, Math.round(drag.originY + dy));
        const shiftX = nextX - drag.originX;
        const shiftY = nextY - drag.originY;
        const originById = new Map(drag.cardOrigins.map((item) => [item.id, item]));

        const next = current.map((column) =>
          column.id === drag.columnId
            ? {
                ...column,
                x: nextX,
                y: nextY,
                cards: column.cards.map((card) => {
                  const origin = originById.get(card.id);
                  if (!origin) return card;
                  return {
                    ...card,
                    x: Math.max(0, Math.round(origin.x + shiftX)),
                    y: Math.max(0, Math.round(origin.y + shiftY)),
                  };
                }),
              }
            : column,
        );
        columnsRef.current = next;
        onChangeRef.current(next);
        return;
      }

      const nextX = Math.max(0, Math.round(drag.originX + dx));
      const nextY = Math.max(0, Math.round(drag.originY + dy));

      if (!drag.moved) {
        drag.moved = true;
        historyBatchStartRef.current?.();
        setSuppressCardClick(true);
        setDraggingCardId(drag.cardId);
        current = current.map((column) =>
          column.id !== drag.columnId
            ? column
            : {
                ...column,
                cards: column.cards.map((card) => {
                  const pos = cardPosition(current, drag.columnId, card);
                  return {
                    ...card,
                    x: typeof card.x === "number" ? card.x : pos.x,
                    y: typeof card.y === "number" ? card.y : pos.y,
                  };
                }),
              },
        );
      }

      const maxZ = Math.max(
        1,
        ...current.flatMap((column) =>
          column.cards.map((card) => (typeof card.z === "number" ? card.z : 1)),
        ),
      );

      const next = current.map((column) =>
        column.id === drag.columnId
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card.id === drag.cardId
                  ? {
                      ...card,
                      x: nextX,
                      y: nextY,
                      z: maxZ + 1,
                      independent: true,
                    }
                  : card,
              ),
            }
          : column,
      );
      columnsRef.current = next;
      onChangeRef.current(next);
    };

    const onUp = (event: PointerEvent) => {
      const drag = freeDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (drag.kind === "column") {
        if (drag.moved) {
          const current = columnsRef.current;
          const sorted = [...current].sort((a, b) => {
            const posA = columnPosition(current, a).x;
            const posB = columnPosition(current, b).x;
            return posA - posB;
          });
          columnsRef.current = sorted;
          onChangeRef.current(sorted);
          historyBatchEndRef.current?.();
        } else {
          const titleInput = document.querySelector<HTMLInputElement>(
            `[data-column-title="${drag.columnId}"]`,
          );
          titleInput?.focus();
          titleInput?.select();
        }
        freeDragRef.current = null;
        setDraggingColumnId(null);
        return;
      }

      if (drag.moved) {
        const current = columnsRef.current;
        const column = current.find((item) => item.id === drag.columnId);
        if (column) {
          const sorted = [...column.cards].sort((a, b) => {
            const posA = cardPosition(current, drag.columnId, a).y;
            const posB = cardPosition(current, drag.columnId, b).y;
            return posA - posB;
          });
          const next = current.map((item) =>
            item.id === drag.columnId ? { ...item, cards: sorted } : item,
          );
          columnsRef.current = next;
          onChangeRef.current(next);
        }
        historyBatchEndRef.current?.();
        window.setTimeout(() => setSuppressCardClick(false), 0);
      } else {
        setSuppressCardClick(false);
      }

      freeDragRef.current = null;
      setDraggingCardId(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const updateCard = (
    columnId: string,
    cardId: string,
    updater: (card: WikiKanbanCard) => WikiKanbanCard,
  ) => {
    onChange(
      columnsRef.current.map((column) =>
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

  const resizeCard = (columnId: string, cardId: string, width: number, height: number) => {
    const current = columnsRef.current;
    const target = current
      .find((column) => column.id === columnId)
      ?.cards.find((card) => card.id === cardId);

    // Formas / texto libre: solo cambian tamaño (pueden volverse rectángulo)
    if (target?.kind === "shape" || target?.kind === "text") {
      const next = current.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card.id === cardId
                  ? { ...card, width, height, scale: undefined }
                  : card,
              ),
            }
          : column,
      );
      columnsRef.current = next;
      onChange(next);
      return;
    }

    // Ancho primero (sin tocar alto) para que el reflow calcule el delta real
    const withWidth = current.map((column) =>
      column.id === columnId
        ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === cardId ? { ...card, width, scale: undefined } : card,
            ),
          }
        : column,
    );
    const next = reflowCardsAfterHeightChange(withWidth, columnId, cardId, height);
    columnsRef.current = next;
    onChange(next);
  };

  const setCardNote = (
    columnId: string,
    cardId: string,
    note: string,
    options?: { fitHeight?: boolean },
  ) => {
    const current = columnsRef.current;
    const column = current.find((item) => item.id === columnId);
    const card = column?.cards.find((item) => item.id === cardId);
    if (!column || !card) return;

    // Formas / texto libre: conservar espacios tal cual (sin reflow ni renombrado)
    if (card.kind === "shape" || card.kind === "text") {
      const next = current.map((item) =>
        item.id === columnId
          ? {
              ...item,
              cards: item.cards.map((entry) =>
                entry.id === cardId ? { ...entry, note } : entry,
              ),
            }
          : item,
      );
      columnsRef.current = next;
      onChange(next);
      return;
    }

    // Título solo como fallback; no reescribe en cada tecla (evita efectos raros al escribir)
    const titled =
      note.split("\n")[0]?.replace(/\*/g, "").trimEnd().slice(0, 80) || card.title || "Tarjeta";
    let next = current.map((item) =>
      item.id === columnId
        ? {
            ...item,
            cards: item.cards.map((entry) =>
              entry.id === cardId
                ? {
                    ...entry,
                    note,
                    title:
                      !entry.title || entry.title === "Nueva tarjeta" || entry.title === "Tarjeta"
                        ? titled || entry.title
                        : entry.title,
                  }
                : entry,
            ),
          }
        : item,
    );

    if (options?.fitHeight) {
      const width = cardWidth({ ...card, note });
      const fitted = estimateCardHeightForNote(note, width);
      next = reflowCardsAfterHeightChange(next, columnId, cardId, fitted);
    } else {
      // Al escribir, crece si el contenido (con espacios) necesita más alto
      const width = cardWidth({ ...card, note });
      const fitted = estimateCardHeightForNote(note, width);
      if (fitted > cardHeight(card)) {
        next = reflowCardsAfterHeightChange(next, columnId, cardId, fitted);
      }
    }

    columnsRef.current = next;
    onChange(next);
  };

  const getCardRect = (cardId: string): CardRect | null => {
    for (const column of columnsRef.current) {
      const card = column.cards.find((item) => item.id === cardId);
      if (!card) continue;
      const pos = cardPosition(columnsRef.current, column.id, card);
      return { x: pos.x, y: pos.y, w: cardWidth(card), h: cardHeight(card) };
    }
    return null;
  };

  const addConnector = (
    fromCardId: string,
    toCardId: string,
    anchors?: { fromAnchor?: WikiConnectorAnchor; toAnchor?: WikiConnectorAnchor },
  ) => {
    if (fromCardId === toCardId) return;
    const current = columnsRef.current;
    const existing = collectConnectors(current);
    if (
      existing.some(
        (item) =>
          item.fromCardId === fromCardId &&
          item.toCardId === toCardId &&
          (item.fromAnchor ?? null) === (anchors?.fromAnchor ?? null) &&
          (item.toAnchor ?? null) === (anchors?.toAnchor ?? null),
      )
    ) {
      return;
    }

    let hostId = connectorHostId(current);
    let nextColumns = current;

    if (!hostId) {
      const host: WikiKanbanColumn = {
        id: createWikiId("col"),
        title: "Lienzo",
        color: "border-t-slate-300",
        hideShell: true,
        cards: [],
        connectors: [],
      };
      nextColumns = [...current, host];
      hostId = host.id;
    }

    const fromRect = getCardRect(fromCardId);
    const toRect = getCardRect(toCardId);
    const pair =
      fromRect && toRect
        ? bestAnchorPair(fromRect, toRect)
        : { fromAnchor: "mr" as WikiConnectorAnchor, toAnchor: "ml" as WikiConnectorAnchor };

    const connector: WikiConnector = {
      id: createWikiId("conn"),
      fromCardId,
      toCardId,
      fromAnchor: anchors?.fromAnchor ?? pair.fromAnchor,
      toAnchor: anchors?.toAnchor ?? pair.toAnchor,
      kind: "arrow",
    };

    onChange(
      nextColumns.map((column) =>
        column.id === hostId
          ? { ...column, connectors: [...(column.connectors ?? []), connector] }
          : column,
      ),
    );
  };

  const removeConnector = (connectorId: string) => {
    onChange(
      columnsRef.current.map((column) =>
        column.connectors?.length
          ? {
              ...column,
              connectors: column.connectors.filter((item) => item.id !== connectorId),
            }
          : column,
      ),
    );
  };

  const handleConnectPick = (cardId: string) => {
    if (!connectMode) return;
    if (!connectFromId) {
      setConnectFromId(cardId);
      return;
    }
    addConnector(connectFromId, cardId);
    setConnectFromId(null);
  };

  const findCardAtPoint = (x: number, y: number, excludeId?: string) => {
    let hit: string | null = null;
    let bestArea = Number.POSITIVE_INFINITY;
    for (const column of columnsRef.current) {
      for (const card of column.cards) {
        if (card.id === excludeId) continue;
        const pos = cardPosition(columnsRef.current, column.id, card);
        const rect = { x: pos.x, y: pos.y, w: cardWidth(card), h: cardHeight(card) };
        if (!pointInRect(x, y, rect)) continue;
        const area = rect.w * rect.h;
        if (area < bestArea) {
          bestArea = area;
          hit = card.id;
        }
      }
    }
    return hit;
  };

  const beginConnectDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    fromCardId: string,
    fromAnchor: WikiConnectorAnchor,
    anchorX: number,
    anchorY: number,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const draft: ConnectDragState = {
      fromCardId,
      fromAnchor,
      startX: anchorX,
      startY: anchorY,
      currentX: anchorX,
      currentY: anchorY,
      hoverCardId: null,
      hoverAnchor: null,
    };
    connectDragRef.current = draft;
    setConnectDrag(draft);

    const onMove = (moveEvent: PointerEvent) => {
      const current = connectDragRef.current;
      if (!current) return;
      const point = clientToCanvas(moveEvent.clientX, moveEvent.clientY);
      const hoverCardId = findCardAtPoint(point.x, point.y, current.fromCardId);
      let currentX = point.x;
      let currentY = point.y;
      let hoverAnchor: WikiConnectorAnchor | null = null;

      if (hoverCardId) {
        const rect = getCardRect(hoverCardId);
        if (rect) {
          hoverAnchor = nearestAnchor(rect, point.x, point.y);
          const snapped = anchorPoint(rect, hoverAnchor);
          currentX = snapped.x;
          currentY = snapped.y;
        }
      }

      const next = {
        ...current,
        currentX,
        currentY,
        hoverCardId,
        hoverAnchor,
      };
      connectDragRef.current = next;
      setConnectDrag(next);
    };

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const current = connectDragRef.current;
      connectDragRef.current = null;
      setConnectDrag(null);
      if (!current) return;
      const point = clientToCanvas(upEvent.clientX, upEvent.clientY);
      const targetId =
        findCardAtPoint(point.x, point.y, current.fromCardId) ?? current.hoverCardId;
      if (!targetId) return;

      const toRect = getCardRect(targetId);
      const toAnchor =
        current.hoverCardId === targetId && current.hoverAnchor
          ? current.hoverAnchor
          : toRect
            ? nearestAnchor(toRect, point.x, point.y)
            : ("ml" as WikiConnectorAnchor);

      addConnector(current.fromCardId, targetId, {
        fromAnchor: current.fromAnchor,
        toAnchor,
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const removeCard = (columnId: string, cardId: string) => {
    onChange(
      columnsRef.current.map((column) => ({
        ...column,
        cards:
          column.id === columnId
            ? column.cards.filter((card) => card.id !== cardId)
            : column.cards,
        connectors: column.connectors?.filter(
          (item) => item.fromCardId !== cardId && item.toCardId !== cardId,
        ),
      })),
    );
  };

  const removeColumn = (columnId: string) => {
    const current = columnsRef.current;
    const target = current.find((column) => column.id === columnId);
    if (!target) return;

    // Solo elimina el bloque y sus tarjetas ligadas.
    // Las tarjetas independientes (libres en el lienzo) se conservan.
    const freeCards = target.cards
      .filter((card) => card.independent || !isCardBoundToColumn(current, target, card))
      .map((card) => ({ ...card, independent: true as const }));

    const remaining = current.filter((column) => column.id !== columnId);

    if (freeCards.length === 0) {
      onChange(remaining);
      return;
    }

    const host = remaining.find((column) => column.hideShell) ?? remaining[0];
    if (host) {
      onChange(
        remaining.map((column) =>
          column.id === host.id
            ? { ...column, cards: [...column.cards, ...freeCards] }
            : column,
        ),
      );
      return;
    }

    // Sin columnas visibles: anfitrión invisible (no pinta otro bloque "Lienzo")
    onChange([
      {
        id: createWikiId("col"),
        title: "",
        color: "border-t-slate-300",
        countLabel: "tarjetas",
        hideShell: true,
        cards: freeCards,
      },
    ]);
  };

  const beginFreeDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    columnId: string,
    card: WikiKanbanCard,
  ) => {
    if (event.button !== 0 || card.locked) return;
    event.preventDefault();
    event.stopPropagation();
    const position = cardPosition(columnsRef.current, columnId, card);
    freeDragRef.current = {
      kind: "card",
      columnId,
      cardId: card.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const beginColumnDrag = (
    event: ReactPointerEvent<HTMLElement>,
    column: WikiKanbanColumn,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const current = columnsRef.current;
    const index = current.findIndex((item) => item.id === column.id);
    const position = columnPosition(current, column, index);
    const cardOrigins = column.cards.map((card) => {
      const pos = cardPosition(current, column.id, card);
      return { id: card.id, x: pos.x, y: pos.y };
    });
    freeDragRef.current = {
      kind: "column",
      columnId: column.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: position.y,
      cardOrigins,
      moved: false,
    };
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
        const origin = columnPosition(currentColumns, column, columnIndex);
        const offsetX = columnShellWidth(column) + COLUMN_GAP;
        const cloneColumn: WikiKanbanColumn = {
          ...column,
          id: createWikiId("col"),
          title: column.title,
          x: origin.x + offsetX,
          y: origin.y,
          z: undefined,
          cards: column.cards.map((card) => {
            const pos = cardPosition(currentColumns, columnId, card);
            return {
              ...card,
              id: createWikiId("kcard"),
              locked: false,
              x: pos.x + offsetX,
              y: pos.y,
            };
          }),
        };
        const nextColumns = [...currentColumns];
        nextColumns.splice(columnIndex >= 0 ? columnIndex + 1 : nextColumns.length, 0, cloneColumn);
        onChange(nextColumns);
      } else if (action === "trash") {
        removeColumn(columnId);
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
      const origin = cardPosition(currentColumns, columnId, card);
      const clone: WikiKanbanCard = {
        ...card,
        id: createWikiId("kcard"),
        locked: false,
        x: origin.x,
        y: origin.y + cardHeight(card) + CARD_STACK_GAP,
        z: (typeof card.z === "number" ? card.z : index) + 1,
      };
      onChange(
        currentColumns.map((item) => {
          if (item.id !== columnId) return item;
          const cards = [...item.cards];
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
      const maxZ = Math.max(
        0,
        ...currentColumns.flatMap((item) =>
          item.cards.map((entry) => (typeof entry.z === "number" ? entry.z : 0)),
        ),
      );
      onChange(
        currentColumns.map((item) =>
          item.id === columnId
            ? {
                ...item,
                cards: item.cards.map((entry) =>
                  entry.id === cardId
                    ? {
                        ...entry,
                        z: action === "bringFront" ? maxZ + 1 : 0,
                      }
                    : entry,
                ),
              }
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

  const visibleColumns = columns.filter((column) => !column.hideShell);

  const canvasWidth = Math.max(
    CANVAS_PAD * 2 +
      visibleColumns.reduce((sum, column, index) => {
        return sum + columnShellWidth(column) + (index > 0 ? COLUMN_GAP : 0);
      }, 0),
    ...columns.map((column, index) => {
      if (column.hideShell) return 0;
      const pos = columnPosition(columns, column, index);
      return pos.x + columnShellWidth(column) + CANVAS_PAD;
    }),
    ...columns.flatMap((column) =>
      column.cards.map((card) => {
        const pos = cardPosition(columns, column.id, card);
        return pos.x + cardWidth(card) + CANVAS_PAD;
      }),
    ),
    800,
  );

  const canvasHeight = Math.max(
    640,
    ...columns.map((column, index) => {
      if (column.hideShell) return 0;
      const pos = columnPosition(columns, column, index);
      return pos.y + columnShellHeight(columns, column) + CANVAS_PAD;
    }),
    ...columns.flatMap((column) =>
      column.cards.map((card) => {
        const pos = cardPosition(columns, column.id, card);
        return pos.y + cardHeight(card) + CANVAS_PAD + 64;
      }),
    ),
  );

  const placePreview = placeDraft && placeTool ? normalizePlaceRect(placeDraft) : null;
  const placePreviewShape = placeTool ? shapeFromPlaceTool(placeTool) : null;

  const cardLookup = new Map<string, { columnId: string; card: WikiKanbanCard; rect: CardRect }>();
  for (const column of columns) {
    for (const card of column.cards) {
      const pos = cardPosition(columns, column.id, card);
      cardLookup.set(card.id, {
        columnId: column.id,
        card,
        rect: { x: pos.x, y: pos.y, w: cardWidth(card), h: cardHeight(card) },
      });
    }
  }

  const connectors = collectConnectors(columns);

  const columnsRow = (
    <div
      className="relative"
      style={{ width: canvasWidth, height: canvasHeight }}
      onPointerDown={beginPlaceDrag}
    >
      <svg
        className="pointer-events-none absolute inset-0 z-[15] overflow-visible"
        width={canvasWidth}
        height={canvasHeight}
        aria-hidden
      >
        <defs>
          <marker
            id="wiki-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#2563eb" />
          </marker>
        </defs>
        {connectors.map((connector) => {
          const from = cardLookup.get(connector.fromCardId);
          const to = cardLookup.get(connector.toCardId);
          if (!from || !to) return null;
          const { start, end } = connectorEndpoints(from.rect, to.rect, connector);
          return (
            <g key={connector.id} className="pointer-events-auto">
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  removeConnector(connector.id);
                }}
              >
                <title>Clic para eliminar conector</title>
              </line>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#2563eb"
                strokeWidth={2.25}
                strokeLinecap="round"
                markerEnd={
                  connector.kind === "line" ? undefined : "url(#wiki-arrowhead)"
                }
                className="pointer-events-none"
              />
              <circle cx={start.x} cy={start.y} r={3} fill="#2563eb" className="pointer-events-none" />
              <circle cx={end.x} cy={end.y} r={3} fill="#2563eb" className="pointer-events-none" />
            </g>
          );
        })}

        {connectDrag && (
          <g className="pointer-events-none">
            <line
              x1={connectDrag.startX}
              y1={connectDrag.startY}
              x2={connectDrag.currentX}
              y2={connectDrag.currentY}
              stroke="#2563eb"
              strokeWidth={2.25}
              strokeDasharray="6 4"
              strokeLinecap="round"
              markerEnd="url(#wiki-arrowhead)"
            />
            <circle
              cx={connectDrag.startX}
              cy={connectDrag.startY}
              r={4}
              fill="#2563eb"
            />
            {connectDrag.hoverAnchor && (
              <circle
                cx={connectDrag.currentX}
                cy={connectDrag.currentY}
                r={5}
                fill="#fff"
                stroke="#2563eb"
                strokeWidth={2}
              />
            )}
          </g>
        )}
      </svg>

      {columns.map((column, columnIndex) => {
        if (column.hideShell) return null;
        const pos = columnPosition(columns, column, columnIndex);
        const width = columnShellWidth(column);
        const height = columnShellHeight(columns, column);
        const isDragging = draggingColumnId === column.id;
        return (
          <div
            key={column.id}
            data-wiki-block="column"
            className={cn(
              "group/column pointer-events-none absolute rounded-sm border border-slate-200 bg-white px-3.5 pb-3.5 pt-5",
              isDragging && "shadow-lg ring-2 ring-slate-400/40",
            )}
            style={{
              left: pos.x,
              top: pos.y,
              // La columna SIEMPRE queda detrás de las tarjetas (si no, se ve blanca)
              zIndex: 1,
              width,
              height,
            }}
            onContextMenu={(event) => openColumnContextMenu(event, column)}
          >
            <button
              type="button"
              data-no-drag
              title="Eliminar bloque"
              aria-label={`Eliminar columna ${column.title || "sin título"}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeColumn(column.id);
              }}
              className="pointer-events-auto absolute right-2 top-2 z-20 rounded bg-white/95 p-1 text-slate-300 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-500 group-hover/column:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div
              data-column-drag-handle
              className="pointer-events-auto mb-5 cursor-grab touch-none select-none px-6 text-center active:cursor-grabbing"
              title="Arrastra para mover el bloque"
              onPointerDown={(event) => beginColumnDrag(event, column)}
              onContextMenu={(event) => openColumnContextMenu(event, column)}
            >
              <input
                data-column-title={column.id}
                className="w-full cursor-grab bg-transparent text-center text-lg font-bold leading-tight tracking-tight text-slate-900 outline-none placeholder:text-slate-400 active:cursor-grabbing"
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
                onPointerDown={(event) => beginColumnDrag(event, column)}
                onContextMenu={(event) => openColumnContextMenu(event, column)}
                placeholder="Columna"
                aria-label="Título de la columna"
                readOnly={isDragging}
              />
            </div>

            <button
              type="button"
              onClick={() => onAddCard(column.id)}
              className="pointer-events-auto absolute bottom-3 left-3.5 right-3.5 flex items-center justify-center gap-1 rounded-sm px-1 py-1.5 text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar tarjeta
            </button>
          </div>
        );
      })}

      {columns.flatMap((column) =>
        column.cards.map((card, cardIndex) => {
          const position = cardPosition(columns, column.id, card);
          const columnDragging = draggingColumnId === column.id;
          return (
            <MockupCard
              key={card.id}
              card={card}
              cardIndex={cardIndex}
              position={position}
              isDragging={draggingCardId === card.id || columnDragging}
              suppressClick={suppressCardClick || columnDragging || Boolean(connectDrag)}
              connectMode={connectMode}
              connectSelected={connectFromId === card.id}
              connectHover={connectDrag?.hoverCardId === card.id}
              onConnectPick={() => handleConnectPick(card.id)}
              onConnectDragStart={(event, anchor, ax, ay) =>
                beginConnectDrag(event, card.id, anchor, ax, ay)
              }
              onUpdate={(updater) => updateCard(column.id, card.id, updater)}
              onResize={(nextW, nextH) => resizeCard(column.id, card.id, nextW, nextH)}
              onResizeStart={() => onHistoryBatchStart?.()}
              onResizeEnd={() => onHistoryBatchEnd?.()}
              onNoteChange={(note) => setCardNote(column.id, card.id, note)}
              onPasteNote={(note) =>
                setCardNote(column.id, card.id, note, { fitHeight: true })
              }
              onRemove={() => removeCard(column.id, card.id)}
              onContextMenu={(event) => openCardContextMenu(event, column.id, card)}
              onFreeDragStart={(event) => beginFreeDrag(event, column.id, card)}
            />
          );
        }),
      )}

      {placePreview && placeTool && (
        <div
          className="pointer-events-none absolute z-[300]"
          style={{
            left: placePreview.x,
            top: placePreview.y,
            width: Math.max(8, placePreview.width || defaultPlaceSize(placeTool).width),
            height: Math.max(8, placePreview.height || defaultPlaceSize(placeTool).height),
          }}
        >
          {placeTool === "texto" ? (
            <div className="flex h-full w-full items-center rounded border border-dashed border-blue-400 bg-white/70 px-2 text-[13px] font-medium text-blue-600/80">
              Texto
            </div>
          ) : placePreviewShape ? (
            <ShapeSvg shape={placePreviewShape} preview />
          ) : null}
        </div>
      )}
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

      {connectMode && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 text-[12px] font-medium text-blue-700 shadow-sm">
          {connectFromId
            ? "Elige el bloque de destino · Esc cancela"
            : "Elige el bloque de origen · Esc cancela"}
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "scrollbar-minimal min-h-0 flex-1 overflow-auto overscroll-contain",
          (placeTool || connectMode || connectDrag) && "cursor-crosshair",
        )}
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
