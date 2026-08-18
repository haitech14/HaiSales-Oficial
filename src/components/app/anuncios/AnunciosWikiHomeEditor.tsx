import { useState } from "react";
import {
  AnunciosWikiBoardToolbar,
  isWikiPlaceTool,
  type WikiBoardToolId,
  type WikiPlaceToolId,
} from "@/components/app/anuncios/AnunciosWikiBoardToolbar";
import { AnunciosWikiKanbanView } from "@/components/app/anuncios/AnunciosWikiKanbanView";
import { useWikiBoardHistory } from "@/hooks/useWikiBoardHistory";
import {
  createWikiId,
  type WikiKanbanCard,
  type WikiKanbanColumn,
  type WikiShapeType,
} from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiHomeEditorProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
  /** Contenedor extra (p. ej. páginas internas sin márgenes negativos) */
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

const SHAPE_FILL = "#93c5fd";
const SHAPE_STROKE = "#2563eb";

function ensureColumn(columns: WikiKanbanColumn[]): {
  columns: WikiKanbanColumn[];
  columnId: string;
} {
  if (columns.length > 0) {
    return { columns, columnId: columns[0].id };
  }
  const column: WikiKanbanColumn = {
    id: createWikiId("col"),
    title: "Ventas",
    color: "border-t-slate-300",
    countLabel: "tarjetas",
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
  card: { title: string; note: string },
): WikiKanbanColumn[] {
  const index = columns[0]?.cards.length ?? 0;
  const offset = index * 28;
  return addFreeCard(columns, {
    title: card.title,
    note: card.note,
    x: 48 + offset,
    y: 48 + offset,
    width: 300,
    height: 160,
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

export function AnunciosWikiHomeEditor({
  columns,
  onChange,
  className,
}: AnunciosWikiHomeEditorProps) {
  const [activeTool, setActiveTool] = useState<WikiBoardToolId>("tablero");
  const { commit, beginBatch, endBatch } = useWikiBoardHistory(columns, onChange);

  const placeTool = isWikiPlaceTool(activeTool) ? activeTool : null;

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
  };

  const handleTool = (id: WikiBoardToolId) => {
    // Formas / texto / flecha: modo herramienta (toggle)
    if (isWikiPlaceTool(id) || id === "linea") {
      setActiveTool(activeTool === id ? "tablero" : id);
      return;
    }

    setActiveTool(id === "more" ? activeTool : id);

    switch (id) {
      case "nota":
        commit(
          addCardToFirst(columns, {
            title: "Nota",
            note: "📝 *Nueva nota*",
          }),
        );
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
              "B    | 1     | $0",
            ].join("\n"),
          }),
        );
        break;
      case "imagen":
        commit(
          addCardToFirst(columns, {
            title: "Imagen",
            note: "🖼️ *Imagen*\n\nPega aquí la URL de la imagen…",
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
        const target = columns.find((column) => column.cards.length > 0);
        if (!target) break;
        commit(
          columns.map((column) =>
            column.id === target.id
              ? { ...column, cards: column.cards.slice(0, -1) }
              : column,
          ),
        );
        break;
      }
      case "tablero":
      case "linea":
      case "more":
      default:
        break;
    }
  };

  const handlePlace = (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!placeTool) return;
    commit(addFreeCard(columns, buildPlaceCard(placeTool, rect)));
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1",
        className ?? "-mx-4 -my-5 sm:-mx-6",
      )}
    >
      <AnunciosWikiBoardToolbar
        activeTool={activeTool}
        onTool={handleTool}
        className="z-30 h-auto min-h-0 shrink-0 self-stretch overflow-y-auto"
      />
      <div className="relative z-0 h-full min-h-0 min-w-0 flex-1">
        <AnunciosWikiKanbanView
          columns={columns}
          onChange={commit}
          onHistoryBatchStart={beginBatch}
          onHistoryBatchEnd={endBatch}
          onAddColumn={addColumn}
          onAddCard={addCard}
          placeTool={placeTool}
          onPlace={handlePlace}
          onCancelPlace={() => setActiveTool("tablero")}
          connectMode={activeTool === "linea"}
          onCancelConnect={() => setActiveTool("tablero")}
          framed
          hideChrome
        />
      </div>
    </div>
  );
}
