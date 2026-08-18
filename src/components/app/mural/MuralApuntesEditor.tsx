import { useCallback, useRef, useState } from "react";
import { AnunciosWikiKanbanView } from "@/components/app/anuncios/AnunciosWikiKanbanView";
import {
  isWikiPlaceTool,
  type WikiBoardToolId,
  type WikiPlaceToolId,
} from "@/components/app/anuncios/AnunciosWikiBoardToolbar";
import {
  MuralApuntesFloatingToolbar,
  type MuralToolbarTool,
} from "@/components/app/mural/MuralApuntesHeader";
import { MuralApuntesCanvasControls } from "@/components/app/mural/MuralApuntesCanvasControls";
import { useWikiBoardHistory } from "@/hooks/useWikiBoardHistory";
import {
  createWikiId,
  type WikiKanbanCard,
  type WikiKanbanColumn,
  type WikiShapeType,
} from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type MuralApuntesEditorProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
  className?: string;
};

const SHAPE_BY_TOOL: Record<
  Exclude<WikiPlaceToolId, "texto">,
  WikiShapeType
> = {
  cuadrado: "square",
  circulo: "circle",
  triangulo: "triangle",
  poligono: "polygon",
};

const SHAPE_FILL = "#fde68a";
const SHAPE_STROKE = "#d97706";

function ensureColumn(columns: WikiKanbanColumn[]): {
  columns: WikiKanbanColumn[];
  columnId: string;
} {
  if (columns.length > 0) {
    return { columns, columnId: columns[0].id };
  }
  const column: WikiKanbanColumn = {
    id: createWikiId("col"),
    title: "Lienzo",
    color: "border-t-slate-300",
    countLabel: "tarjetas",
    hideShell: true,
    cards: [],
  };
  return { columns: [column], columnId: column.id };
}

function addFreeCard(
  columns: WikiKanbanColumn[],
  card: Omit<WikiKanbanCard, "id">,
): WikiKanbanColumn[] {
  const ensured = ensureColumn(columns);
  const host =
    ensured.columns.find((column) => column.hideShell) ??
    ensured.columns.find((column) => column.id === ensured.columnId)!;

  return ensured.columns.map((column) => {
    if (column.id !== host.id) return column;
    return {
      ...column,
      hideShell: true,
      cards: [
        ...column.cards,
        {
          id: createWikiId("kcard"),
          independent: true,
          ...card,
        },
      ],
    };
  });
}

function addCardToFirst(
  columns: WikiKanbanColumn[],
  card: { title: string; note: string; width?: number; height?: number },
): WikiKanbanColumn[] {
  const index = columns.flatMap((column) => column.cards).length;
  const offset = index * 28;
  return addFreeCard(columns, {
    title: card.title,
    note: card.note,
    x: 72 + offset,
    y: 72 + offset,
    width: card.width ?? 280,
    height: card.height ?? 160,
  });
}

function buildPlaceCard(
  tool: WikiPlaceToolId,
  rect: { x: number; y: number; width: number; height: number },
): Omit<WikiKanbanCard, "id"> {
  if (tool === "texto") {
    return {
      kind: "text",
      title: "Texto",
      note: "Texto",
      x: rect.x,
      y: rect.y,
      width: Math.max(120, rect.width),
      height: Math.max(36, rect.height),
      independent: true,
    };
  }

  const shape = SHAPE_BY_TOOL[tool];
  const labels: Record<WikiShapeType, string> = {
    square: "Cuadrado",
    circle: "Círculo",
    triangle: "Triángulo",
    polygon: "Polígono",
  };

  return {
    kind: "shape",
    shape,
    title: labels[shape],
    note: "",
    fill: SHAPE_FILL,
    stroke: SHAPE_STROKE,
    x: rect.x,
    y: rect.y,
    width: Math.max(64, rect.width),
    height: Math.max(64, rect.height),
    independent: true,
  };
}

function mapToolbarToBoardTool(tool: MuralToolbarTool): WikiBoardToolId {
  if (tool === "seleccion") return "tablero";
  if (tool === "mano") return "tablero";
  if (tool === "conectores") return "linea";
  return tool;
}

export function MuralApuntesEditor({ columns, onChange, className }: MuralApuntesEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<MuralToolbarTool>("seleccion");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const { commit, beginBatch, endBatch, undo, redo } = useWikiBoardHistory(columns, onChange);

  const boardTool = mapToolbarToBoardTool(activeTool);
  const placeTool = isWikiPlaceTool(boardTool) ? boardTool : null;
  const panMode = activeTool === "mano";

  const refreshHistoryState = useCallback(() => {
    setCanUndo(true);
    setCanRedo(true);
  }, []);

  const addColumn = () => {
    commit([
      ...columns,
      {
        id: createWikiId("col"),
        title: "Nueva columna",
        color: "border-t-slate-300",
        countLabel: "tarjetas",
        cards: [],
      },
    ]);
    refreshHistoryState();
  };

  const addCard = (columnId: string) => {
    commit(
      columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: [
                ...column.cards,
                {
                  id: createWikiId("kcard"),
                  title: "Nueva tarjeta",
                  note: "",
                },
              ],
            }
          : column,
      ),
    );
    refreshHistoryState();
  };

  const addNote = () => {
    commit(
      addCardToFirst(columns, {
        title: "Nota",
        note: "📝 *Nueva nota*\nEscribe aquí…",
      }),
    );
    refreshHistoryState();
  };

  const handleBoardTool = (id: WikiBoardToolId) => {
    if (isWikiPlaceTool(id) || id === "linea") {
      setActiveTool(id === "linea" ? "conectores" : id);
      return;
    }

    setActiveTool(id === "more" ? activeTool : id === "tablero" ? "seleccion" : id);

    switch (id) {
      case "nota":
        addNote();
        break;
      case "enlace":
        commit(
          addCardToFirst(columns, {
            title: "Enlace",
            note: "🔗 *Nuevo enlace*\nhttps://",
          }),
        );
        break;
      case "todo":
        commit(
          addCardToFirst(columns, {
            title: "To-do",
            note: "☐ Pendiente 1\n☐ Pendiente 2\n☐ Pendiente 3",
          }),
        );
        break;
      case "columna":
        addColumn();
        break;
      case "comenta":
        commit(
          addCardToFirst(columns, {
            title: "Comentario",
            note: "💬 *Comentario*\n\nEscribe tu comentario…",
          }),
        );
        break;
      case "tabla":
        commit(
          addCardToFirst(columns, {
            title: "Tabla",
            note: [
              "📊 *Tabla*",
              "",
              "Item | Cant. | Precio",
              "-----|-------|-------",
              "A    | 1     | $0",
            ].join("\n"),
            width: 320,
            height: 180,
          }),
        );
        break;
      case "imagen":
        commit(
          addCardToFirst(columns, {
            title: "Imagen",
            note: "🖼️ *Imagen*\n\nPega aquí la URL de la imagen…",
            width: 320,
            height: 200,
          }),
        );
        break;
      case "subir":
        commit(
          addCardToFirst(columns, {
            title: "Archivo",
            note: "📎 *Archivo*\n\nDescribe o pega el enlace del archivo…",
          }),
        );
        break;
      case "dibujar":
        commit(
          addCardToFirst(columns, {
            title: "Dibujo",
            note: "✏️ *Dibujo*\n\nEspacio para anotar un boceto…",
          }),
        );
        break;
      case "papelera": {
        const allCards = columns.flatMap((column) =>
          column.cards.map((card) => ({ columnId: column.id, card })),
        );
        const last = allCards[allCards.length - 1];
        if (!last) break;
        commit(
          columns.map((column) =>
            column.id === last.columnId
              ? { ...column, cards: column.cards.filter((card) => card.id !== last.card.id) }
              : column,
          ),
        );
        break;
      }
      default:
        break;
    }
    refreshHistoryState();
  };

  const handleToolbar = (tool: MuralToolbarTool) => {
    if (tool === "seleccion") {
      setActiveTool("seleccion");
      return;
    }
    if (tool === "mano") {
      setActiveTool("mano");
      return;
    }
    if (tool === "conectores") {
      handleBoardTool("linea");
      return;
    }
    if (tool === "cuadrado") {
      handleBoardTool("cuadrado");
      return;
    }
    handleBoardTool(mapToolbarToBoardTool(tool));
  };

  const handlePlace = (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!placeTool) return;
    commit(addFreeCard(columns, buildPlaceCard(placeTool, rect)));
    refreshHistoryState();
  };

  const handleFullscreen = () => {
    canvasRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div ref={canvasRef} className={cn("relative min-h-0 flex-1 overflow-hidden", className)}>
      <MuralApuntesFloatingToolbar
        activeTool={activeTool}
        onTool={handleToolbar}
        onAddNote={addNote}
        containerRef={canvasRef}
      />
      <MuralApuntesCanvasControls
        onUndo={() => {
          undo();
          refreshHistoryState();
        }}
        onRedo={() => {
          redo();
          refreshHistoryState();
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onFullscreen={handleFullscreen}
      />

      <div
        className={cn(
          "h-full min-h-[520px] bg-[#eef1f5]",
          panMode && "cursor-grab active:cursor-grabbing",
        )}
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <AnunciosWikiKanbanView
          columns={columns}
          onChange={commit}
          onHistoryBatchStart={beginBatch}
          onHistoryBatchEnd={endBatch}
          onAddColumn={addColumn}
          onAddCard={addCard}
          placeTool={placeTool}
          onPlace={handlePlace}
          onCancelPlace={() => setActiveTool("seleccion")}
          connectMode={boardTool === "linea"}
          onCancelConnect={() => setActiveTool("seleccion")}
          framed
          hideChrome
          zoomSlotId="mural-zoom-slot"
          transparentCanvas
          panMode={panMode}
        />
      </div>
    </div>
  );
}
