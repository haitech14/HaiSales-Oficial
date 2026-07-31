import { useState } from "react";
import {
  AnunciosWikiBoardToolbar,
  type WikiBoardToolId,
} from "@/components/app/anuncios/AnunciosWikiBoardToolbar";
import { AnunciosWikiKanbanView } from "@/components/app/anuncios/AnunciosWikiKanbanView";
import { createWikiId, type WikiKanbanColumn } from "@/lib/anuncios/wiki-store";

type AnunciosWikiHomeEditorProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
};

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

function addCardToFirst(
  columns: WikiKanbanColumn[],
  card: { title: string; note: string },
): WikiKanbanColumn[] {
  const ensured = ensureColumn(columns);
  return ensured.columns.map((column) =>
    column.id === ensured.columnId
      ? {
          ...column,
          cards: [
            ...column.cards,
            {
              id: createWikiId("kcard"),
              title: card.title,
              note: card.note,
            },
          ],
        }
      : column,
  );
}

export function AnunciosWikiHomeEditor({ columns, onChange }: AnunciosWikiHomeEditorProps) {
  const [activeTool, setActiveTool] = useState<WikiBoardToolId>("tablero");

  const addColumn = () => {
    onChange([
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
    onChange(
      columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: [
                ...column.cards,
                {
                  id: createWikiId("kcard"),
                  title: "Nueva tarjeta",
                  note: "Escribe aquí… Usa *negrita* y emojis 👋",
                },
              ],
            }
          : column,
      ),
    );
  };

  const handleTool = (id: WikiBoardToolId) => {
    setActiveTool(id === "more" || id === "linea" ? activeTool : id);

    switch (id) {
      case "nota":
        onChange(
          addCardToFirst(columns, {
            title: "Nota",
            note: "📝 *Nueva nota*\n\nEscribe aquí…",
          }),
        );
        break;
      case "enlace":
        onChange(
          addCardToFirst(columns, {
            title: "Enlace",
            note: "🔗 *Nuevo enlace*\nhttps://",
          }),
        );
        break;
      case "todo":
        onChange(
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
        onChange(
          addCardToFirst(columns, {
            title: "Comentario",
            note: "💬 *Comentario*\n\nEscribe tu comentario…",
          }),
        );
        break;
      case "tabla":
        onChange(
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
        onChange(
          addCardToFirst(columns, {
            title: "Imagen",
            note: "🖼️ *Imagen*\n\nPega aquí la URL de la imagen…",
          }),
        );
        break;
      case "subir":
        onChange(
          addCardToFirst(columns, {
            title: "Archivo",
            note: "📎 *Archivo*\n\nDescribe o pega el enlace del archivo…",
          }),
        );
        break;
      case "dibujar":
        onChange(
          addCardToFirst(columns, {
            title: "Dibujo",
            note: "✏️ *Dibujo*\n\nEspacio para anotar un boceto…",
          }),
        );
        break;
      case "papelera": {
        const target = columns.find((column) => column.cards.length > 0);
        if (!target) break;
        onChange(
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

  return (
    <div className="-mx-4 -my-5 flex min-h-0 flex-1 sm:-mx-6">
      <AnunciosWikiBoardToolbar
        activeTool={activeTool}
        onTool={handleTool}
        className="h-full overflow-y-auto"
      />
      <div className="min-h-0 min-w-0 flex-1">
        <AnunciosWikiKanbanView
          columns={columns}
          onChange={onChange}
          onAddColumn={addColumn}
          onAddCard={addCard}
          framed
          hideChrome
        />
      </div>
    </div>
  );
}
