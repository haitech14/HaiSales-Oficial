import { useState } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import { AnunciosKanbanCard } from "@/components/app/anuncios/AnunciosKanbanCard";
import type { KanbanColumnData } from "@/lib/anuncios/anuncios-service";
import type { AnuncioArea } from "@/lib/anuncios/anuncios-mock-data";
import { cn } from "@/lib/utils";

type AnunciosKanbanColumnProps = {
  column: KanbanColumnData & { copy: string };
  onCopyChange: (area: AnuncioArea, copy: string) => void;
};

export function AnunciosKanbanColumn({ column, onCopyChange }: AnunciosKanbanColumnProps) {
  const [editingCopy, setEditingCopy] = useState(false);
  const [draftCopy, setDraftCopy] = useState(column.copy);

  const saveCopy = () => {
    onCopyChange(column.area.id, draftCopy.trim() || column.area.defaultCopy);
    setEditingCopy(false);
  };

  return (
    <div
      className={cn(
        "flex w-[236px] shrink-0 flex-col rounded-xl border border-slate-200 border-t-[3px] bg-slate-50/60",
        column.area.borderColor,
      )}
    >
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", column.area.dotColor)} />
            <h3 className={cn("truncate text-sm font-bold", column.area.headerColor)}>
              {column.area.label}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", column.area.badgeBg)}>
              {column.count}
            </span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-600"
              aria-label={`Agregar tarea en ${column.area.label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/80 p-2">
          {editingCopy ? (
            <div className="space-y-1.5">
              <textarea
                value={draftCopy}
                onChange={(event) => setDraftCopy(event.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                placeholder="Escribe copy con emoticones..."
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDraftCopy(column.copy);
                    setEditingCopy(false);
                  }}
                  className="rounded px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveCopy}
                  className="flex items-center gap-0.5 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-500"
                >
                  <Check className="h-3 w-3" />
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftCopy(column.copy);
                setEditingCopy(true);
              }}
              className="group flex w-full items-start gap-1.5 text-left"
            >
              <p className="min-w-0 flex-1 text-[11px] leading-snug text-slate-600">{column.copy}</p>
              <Pencil className="mt-0.5 h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-500" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-2">
        {column.tasks.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-slate-400">Sin tareas en esta área</p>
        ) : (
          column.tasks.map((task) => <AnunciosKanbanCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
