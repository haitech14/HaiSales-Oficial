import { ListTodo, Plus, Trash2 } from "lucide-react";
import { WikiWhatsAppInput } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import { Button } from "@/components/ui/button";
import type { WikiTodoItem } from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiPendientesSidebarProps = {
  pageTitle: string;
  todos: WikiTodoItem[];
  onChange: (todos: WikiTodoItem[]) => void;
  className?: string;
};

export function AnunciosWikiPendientesSidebar({
  pageTitle,
  todos,
  onChange,
  className,
}: AnunciosWikiPendientesSidebarProps) {
  const pending = todos.filter((todo) => !todo.done).length;

  const addTodo = () => {
    onChange([
      ...todos,
      {
        id: `todo-${Date.now()}`,
        title: "Nuevo pendiente",
        done: false,
        reminderAt: "",
      },
    ]);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col border-l border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-slate-800">
            <ListTodo className="h-4 w-4 shrink-0 text-blue-600" />
            <h3 className="truncate text-sm font-semibold">Pendientes</h3>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{pageTitle}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          {pending}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5"
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={(event) =>
                  onChange(
                    todos.map((item) =>
                      item.id === todo.id ? { ...item, done: event.target.checked } : item,
                    ),
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <WikiWhatsAppInput
                  value={todo.title}
                  onChange={(title) =>
                    onChange(
                      todos.map((item) =>
                        item.id === todo.id ? { ...item, title } : item,
                      ),
                    )
                  }
                  inputClassName={cn(
                    "text-[13px]",
                    todo.done && "text-slate-400 line-through",
                  )}
                />
                <input
                  type="date"
                  value={todo.reminderAt ?? ""}
                  onChange={(event) =>
                    onChange(
                      todos.map((item) =>
                        item.id === todo.id
                          ? { ...item, reminderAt: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600"
                  aria-label="Recordatorio"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(todos.filter((item) => item.id !== todo.id))}
                className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                aria-label="Eliminar pendiente"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {todos.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-400">
            Sin pendientes en esta página.
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-1.5 text-xs"
          onClick={addTodo}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar pendiente
        </Button>
      </div>
    </aside>
  );
}
