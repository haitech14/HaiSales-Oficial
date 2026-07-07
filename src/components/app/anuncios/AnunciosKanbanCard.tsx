import { Calendar } from "lucide-react";
import type { AnuncioTask } from "@/lib/anuncios/anuncios-mock-data";
import { getEstadoStyles, getPrioridadStyles } from "@/lib/anuncios/anuncios-mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AnunciosKanbanCard({ task }: { task: AnuncioTask }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        <span
          className={cn(
            "inline-flex rounded-full border px-1.5 py-0 text-[10px] font-semibold",
            getPrioridadStyles(task.prioridad),
          )}
        >
          {task.prioridad}
        </span>
        <span
          className={cn(
            "inline-flex rounded-full border px-1.5 py-0 text-[10px] font-semibold",
            getEstadoStyles(task.estado),
          )}
        >
          {task.estado}
        </span>
      </div>
      <p className="text-[11px] font-semibold leading-snug text-slate-900">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <Calendar className="h-3 w-3" />
          {task.dueDate}
        </span>
        <div className="flex items-center gap-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-blue-100 text-[8px] font-semibold text-blue-700">
              {task.assigneeInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-slate-600">{task.assignee}</span>
        </div>
      </div>
    </article>
  );
}
