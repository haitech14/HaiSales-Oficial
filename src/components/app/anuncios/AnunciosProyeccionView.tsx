import { AlertTriangle, Calendar } from "lucide-react";
import type { AnuncioTask } from "@/lib/anuncios/anuncios-mock-data";
import { anuncioAreas, getEstadoStyles, getPrioridadStyles } from "@/lib/anuncios/anuncios-mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ProyeccionSection({
  title,
  subtitle,
  tasks,
  accentClass,
}: {
  title: string;
  subtitle: string;
  tasks: AnuncioTask[];
  accentClass: string;
}) {
  const grouped = anuncioAreas
    .map((area) => ({
      area,
      tasks: tasks.filter((task) => task.area === area.id),
    }))
    .filter((group) => group.tasks.length > 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("border-b border-slate-100 px-4 py-3", accentClass)}>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{tasks.length}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {grouped.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Sin tareas en esta proyección</p>
        ) : (
          grouped.map(({ area, tasks: areaTasks }) => (
            <div key={area.id} className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", area.dotColor)} />
                <span className={cn("text-xs font-semibold", area.headerColor)}>{area.label}</span>
                <span className="text-xs text-slate-400">({areaTasks.length})</span>
              </div>
              <ul className="space-y-2">
                {areaTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {task.prioridad === "Alta" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                      )}
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                          {task.assigneeInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

type AnunciosProyeccionViewProps = {
  porHacer: AnuncioTask[];
  pendientes: AnuncioTask[];
};

export function AnunciosProyeccionView({ porHacer, pendientes }: AnunciosProyeccionViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
      <ProyeccionSection
        title="Por hacer"
        subtitle="Tareas por ejecutar en las próximas semanas"
        tasks={porHacer}
        accentClass="bg-emerald-50/50"
      />
      <ProyeccionSection
        title="Pendientes"
        subtitle="En curso y prioridad alta que requieren seguimiento"
        tasks={pendientes}
        accentClass="bg-orange-50/50"
      />
    </div>
  );
}
