import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  CheckSquare,
  Image as ImageIcon,
  Link2,
  StickyNote,
  Table2,
  Trash2,
} from "lucide-react";
import { WikiWhatsAppTextarea } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import {
  createEmptyMuralBlock,
  createWikiId,
  type WikiMuralBlock,
  type WikiMuralBlockType,
  type WikiMuralColumn,
} from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiMuralViewProps = {
  columns: WikiMuralColumn[];
  onChange: (columns: WikiMuralColumn[]) => void;
};

const TOOLS: { type: WikiMuralBlockType; label: string; icon: typeof StickyNote }[] = [
  { type: "note", label: "Nota", icon: StickyNote },
  { type: "link", label: "Enlace", icon: Link2 },
  { type: "todo", label: "To-do", icon: CheckSquare },
  { type: "table", label: "Tabla", icon: Table2 },
  { type: "image", label: "Imagen", icon: ImageIcon },
];

type DragMove = {
  blockId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

function ensureCanvas(columns: WikiMuralColumn[]): WikiMuralColumn[] {
  if (columns.length > 0) return columns;
  return [{ id: createWikiId("mcol"), title: "Canvas", blocks: [] }];
}

function allBlocks(columns: WikiMuralColumn[]): WikiMuralBlock[] {
  return columns.flatMap((column) => column.blocks);
}

function withUpdatedBlock(
  columns: WikiMuralColumn[],
  blockId: string,
  updater: (block: WikiMuralBlock) => WikiMuralBlock,
): WikiMuralColumn[] {
  return columns.map((column) => ({
    ...column,
    blocks: column.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
  }));
}

function MuralCard({
  block,
  onChange,
  onRemove,
  onPointerDown,
}: {
  block: WikiMuralBlock;
  onChange: (block: WikiMuralBlock) => void;
  onRemove: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="group absolute z-10 rounded-xl border border-slate-200 bg-white p-3 shadow-md"
      style={{
        left: block.x,
        top: block.y,
        width: block.w ?? 280,
      }}
    >
      <div
        className="mb-2 flex cursor-grab items-center justify-between active:cursor-grabbing"
        onPointerDown={onPointerDown}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {block.type === "note"
            ? "Nota"
            : block.type === "link"
              ? "Enlace"
              : block.type === "todo"
                ? "To-do"
                : block.type === "table"
                  ? "Tabla"
                  : "Imagen"}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
          aria-label="Eliminar"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {block.type === "note" && (
        <WikiWhatsAppTextarea
          value={block.content}
          onChange={(content) => onChange({ ...block, content })}
          rows={5}
          placeholder="Mensaje WhatsApp..."
          inputClassName="border-0 px-0 py-0 pr-8 shadow-none focus:ring-0"
        />
      )}

      {block.type === "todo" && (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={Boolean(block.done)}
            onChange={(event) => onChange({ ...block, done: event.target.checked })}
            className="mt-1.5 h-4 w-4 rounded border-slate-300"
          />
          <WikiWhatsAppTextarea
            value={block.content}
            onChange={(content) => onChange({ ...block, content })}
            singleLine
            className="flex-1"
            inputClassName={cn(
              "border-0 px-0 py-0 pr-8 shadow-none focus:ring-0",
              block.done && "text-slate-400 line-through",
            )}
          />
        </label>
      )}

      {block.type === "link" && (
        <div className="space-y-2">
          <WikiWhatsAppTextarea
            value={block.content}
            onChange={(content) => onChange({ ...block, content })}
            singleLine
            placeholder="Título del enlace"
            inputClassName="border-0 px-0 py-0 pr-8 font-medium shadow-none focus:ring-0"
          />
          <input
            type="url"
            value={block.url ?? ""}
            onChange={(event) => onChange({ ...block, url: event.target.value })}
            placeholder="https://"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <WikiWhatsAppTextarea
            value={block.content}
            onChange={(content) => onChange({ ...block, content })}
            singleLine
            placeholder="Descripción"
            inputClassName="border-0 px-0 py-0 pr-8 shadow-none focus:ring-0"
          />
          <input
            type="url"
            value={block.url ?? ""}
            onChange={(event) => onChange({ ...block, url: event.target.value })}
            placeholder="URL de imagen https://"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/15"
          />
          {block.url ? (
            <img
              src={block.url}
              alt={block.content || "Imagen"}
              className="max-h-40 w-full rounded-lg object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
              Pega una URL de imagen
            </div>
          )}
        </div>
      )}

      {block.type === "table" && block.table && (
        <div className="space-y-2 overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr>
                {block.table.columns.map((column, colIndex) => (
                  <th key={`h-${colIndex}`} className="border border-slate-200 bg-slate-50 px-2 py-1">
                    <input
                      className="w-full bg-transparent font-semibold outline-none"
                      value={column}
                      onChange={(event) => {
                        const columns = block.table!.columns.map((item, index) =>
                          index === colIndex ? event.target.value : item,
                        );
                        onChange({ ...block, table: { ...block.table!, columns } });
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, rowIndex) => (
                <tr key={`r-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <td key={`c-${rowIndex}-${colIndex}`} className="border border-slate-200 px-2 py-1">
                      <input
                        className="w-full bg-transparent outline-none"
                        value={cell}
                        onChange={(event) => {
                          const rows = block.table!.rows.map((item, r) =>
                            r === rowIndex
                              ? item.map((value, c) =>
                                  c === colIndex ? event.target.value : value,
                                )
                              : item,
                          );
                          onChange({ ...block, table: { ...block.table!, rows } });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AnunciosWikiMuralView({ columns, onChange }: AnunciosWikiMuralViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMove | null>(null);
  const safeColumns = ensureCanvas(columns);
  const blocks = allBlocks(safeColumns);

  const addBlock = (type: WikiMuralBlockType) => {
    const nextColumns = ensureCanvas(columns);
    const offset = nextColumns[0].blocks.length * 28;
    const block = createEmptyMuralBlock(type, { x: 48 + offset, y: 48 + offset });
    onChange(
      nextColumns.map((column, index) =>
        index === 0 ? { ...column, blocks: [...column.blocks, block] } : column,
      ),
    );
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const nextX = Math.max(0, drag.originX + dx);
    const nextY = Math.max(0, drag.originY + dy);
    onChange(
      withUpdatedBlock(safeColumns, drag.blockId, (block) => ({
        ...block,
        x: nextX,
        y: nextY,
      })),
    );
  };

  return (
    <div className="flex min-h-[520px] gap-3">
      <aside className="flex w-14 shrink-0 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.type}
              type="button"
              title={tool.label}
              onClick={() => addBlock(tool.type)}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <Icon className="h-4 w-4" />
              {tool.label}
            </button>
          );
        })}
      </aside>

      <div
        ref={canvasRef}
        className="relative min-h-[520px] min-w-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-[#eef1f5]"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <div className="relative h-[900px] w-[1400px]">
          {blocks.map((block) => (
            <MuralCard
              key={block.id}
              block={block}
              onChange={(next) =>
                onChange(withUpdatedBlock(safeColumns, block.id, () => next))
              }
              onRemove={() =>
                onChange(
                  safeColumns.map((column) => ({
                    ...column,
                    blocks: column.blocks.filter((item) => item.id !== block.id),
                  })),
                )
              }
              onPointerDown={(event) => {
                event.preventDefault();
                (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
                setDrag({
                  blockId: block.id,
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: block.x,
                  originY: block.y,
                });
              }}
            />
          ))}
          {blocks.length === 0 && (
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">
              Usa la barra lateral para agregar tarjetas y arrástralas a cualquier lugar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
