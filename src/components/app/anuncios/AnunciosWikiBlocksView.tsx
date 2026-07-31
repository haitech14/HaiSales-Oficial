import { useState } from "react";
import {
  CheckSquare,
  GripVertical,
  Heading2,
  List,
  Minus,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { WikiWhatsAppInput, WikiWhatsAppTextarea } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import { Button } from "@/components/ui/button";
import {
  createEmptyDocBlock,
  reorderList,
  type WikiDocBlock,
  type WikiDocBlockType,
} from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

export const WIKI_BLOCK_MOVE_TYPE = "application/x-wiki-block-move";
export const WIKI_BLOCK_TOOL_TYPE = "application/x-wiki-block-type";

export type WikiBlockMovePayload = {
  cardId: string;
  index: number;
};

type AnunciosWikiBlocksViewProps = {
  blocks: WikiDocBlock[];
  onChange: (blocks: WikiDocBlock[]) => void;
  cardId?: string;
  onMoveBlock?: (payload: {
    fromCardId: string;
    fromIndex: number;
    toCardId: string;
    toIndex: number;
  }) => void;
  compact?: boolean;
  hideToolbar?: boolean;
};

const ADD_OPTIONS: { type: WikiDocBlockType; label: string; icon: typeof Type }[] = [
  { type: "paragraph", label: "Texto", icon: Type },
  { type: "heading", label: "Título", icon: Heading2 },
  { type: "todo", label: "To-do", icon: CheckSquare },
  { type: "bullet", label: "Lista", icon: List },
  { type: "divider", label: "Divisor", icon: Minus },
];

export function AnunciosWikiBlocksView({
  blocks,
  onChange,
  cardId,
  onMoveBlock,
  compact = false,
  hideToolbar = false,
}: AnunciosWikiBlocksViewProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const updateBlock = (blockId: string, updater: (block: WikiDocBlock) => WikiDocBlock) => {
    onChange(blocks.map((block) => (block.id === blockId ? updater(block) : block)));
  };

  const removeBlock = (blockId: string) => {
    onChange(blocks.filter((block) => block.id !== blockId));
  };

  const addBlock = (type: WikiDocBlockType) => {
    onChange([...blocks, createEmptyDocBlock(type)]);
  };

  return (
    <div className={cn(!compact && "mx-auto max-w-3xl")}>
      {!compact && (
        <p className="mb-3 text-xs text-slate-400">
          Arrastra bloques con ⠿. Puedes soltarlos en otra tarjeta.
        </p>
      )}

      <div className="rounded-lg">
        {blocks.map((block, index) => {
          const prev = blocks[index - 1];
          const next = blocks[index + 1];
          const sameAsPrev = prev?.type === block.type && (block.type === "bullet" || block.type === "todo");
          const sameAsNext = next?.type === block.type && (block.type === "bullet" || block.type === "todo");
          const inListGroup = block.type === "bullet" || block.type === "todo";

          return (
            <div
              key={block.id}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();

                const moveRaw = event.dataTransfer.getData(WIKI_BLOCK_MOVE_TYPE);
                if (moveRaw && cardId && onMoveBlock) {
                  try {
                    const payload = JSON.parse(moveRaw) as WikiBlockMovePayload;
                    onMoveBlock({
                      fromCardId: payload.cardId,
                      fromIndex: payload.index,
                      toCardId: cardId,
                      toIndex: index,
                    });
                  } catch {
                    /* ignore */
                  }
                } else {
                  const from = dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isFinite(from)) {
                    onChange(reorderList(blocks, from, index));
                  }
                }

                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                "group relative flex items-start gap-0.5 px-0.5 transition",
                inListGroup ? "py-0.5" : "py-1",
                !sameAsPrev && inListGroup && "mt-1",
                !sameAsNext && inListGroup && "mb-1",
                !inListGroup && "my-0.5",
                overIndex === index && dragIndex !== null && dragIndex !== index && "bg-slate-100/80",
                dragIndex === index && "opacity-40",
              )}
            >
              <button
                type="button"
                draggable
                className="mt-1 shrink-0 cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition hover:text-slate-500 active:cursor-grabbing group-hover:opacity-100"
                aria-label="Arrastrar bloque"
                title="Arrastrar bloque"
                onDragStart={(event) => {
                  event.stopPropagation();
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                  if (cardId) {
                    const payload: WikiBlockMovePayload = { cardId, index };
                    event.dataTransfer.setData(WIKI_BLOCK_MOVE_TYPE, JSON.stringify(payload));
                  }
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
              >
                <GripVertical className="pointer-events-none h-3.5 w-3.5" />
              </button>

              <div className="min-w-0 flex-1" draggable={false}>
                {block.type === "heading" && (
                  <WikiWhatsAppInput
                    value={block.content}
                    onChange={(content) => updateBlock(block.id, (item) => ({ ...item, content }))}
                    hideEmojiPicker
                    inputClassName="text-lg font-semibold text-slate-900"
                    placeholder="Título"
                  />
                )}

                {block.type === "paragraph" && (
                  <WikiWhatsAppTextarea
                    value={block.content}
                    onChange={(content) => updateBlock(block.id, (item) => ({ ...item, content }))}
                    rows={2}
                    hideEmojiPicker
                    showPreview={
                      block.content.includes("*") ||
                      block.content.includes("_") ||
                      block.content.includes("~")
                    }
                    placeholder="Escribe aquí…"
                    inputClassName="border-0 bg-transparent px-0 py-0.5 shadow-none focus:border-transparent focus:ring-0"
                  />
                )}

                {block.type === "todo" && (
                  <label className="flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={Boolean(block.done)}
                      onChange={(event) =>
                        updateBlock(block.id, (item) => ({ ...item, done: event.target.checked }))
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                    <WikiWhatsAppInput
                      value={block.content}
                      onChange={(content) => updateBlock(block.id, (item) => ({ ...item, content }))}
                      hideEmojiPicker
                      inputClassName={cn(
                        "text-sm text-slate-700",
                        block.done && "text-slate-400 line-through",
                      )}
                      placeholder="Pendiente"
                    />
                  </label>
                )}

                {block.type === "bullet" && (
                  <div className="flex items-start gap-2 py-0.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <WikiWhatsAppInput
                      value={block.content}
                      onChange={(content) => updateBlock(block.id, (item) => ({ ...item, content }))}
                      hideEmojiPicker
                      inputClassName="text-sm text-slate-700"
                      placeholder="Elemento de lista"
                    />
                  </div>
                )}

                {block.type === "divider" && (
                  <div className="flex h-6 items-center">
                    <hr className="w-full border-slate-200" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="mt-1 shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                aria-label="Eliminar bloque"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {blocks.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">
          Tarjeta vacía. Arrastra un bloque aquí.
        </p>
      )}

      {!hideToolbar && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {ADD_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.type}
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-8 gap-1 text-[11px]", compact && "px-1.5")}
                onClick={() => addBlock(option.type)}
              >
                <Plus className="h-3 w-3" />
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
