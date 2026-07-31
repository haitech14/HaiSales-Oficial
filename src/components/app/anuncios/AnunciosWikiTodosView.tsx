import { Link2, Plus, Trash2 } from "lucide-react";
import { WikiWhatsAppInput } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import { Button } from "@/components/ui/button";
import type { WikiLinkItem, WikiTodoItem } from "@/lib/anuncios/wiki-store";
import { renderWhatsAppText } from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

type AnunciosWikiTodosViewProps = {
  todos: WikiTodoItem[];
  links: WikiLinkItem[];
  onTodosChange: (todos: WikiTodoItem[]) => void;
  onLinksChange: (links: WikiLinkItem[]) => void;
};

export function AnunciosWikiTodosView({
  todos,
  links,
  onTodosChange,
  onLinksChange,
}: AnunciosWikiTodosViewProps) {
  const addTodo = () => {
    onTodosChange([
      ...todos,
      { id: `todo-${Date.now()}`, title: "Nuevo pendiente", done: false, reminderAt: "" },
    ]);
  };

  const addLink = () => {
    onLinksChange([
      ...links,
      { id: `link-${Date.now()}`, title: "Nuevo enlace", url: "https://" },
    ]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Pendientes y recordatorios</p>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addTodo}>
            <Plus className="h-3.5 w-3.5" />
            Pendiente
          </Button>
        </div>
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
            >
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={(event) =>
                    onTodosChange(
                      todos.map((item) =>
                        item.id === todo.id ? { ...item, done: event.target.checked } : item,
                      ),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="min-w-0 flex-1">
                  <WikiWhatsAppInput
                    value={todo.title}
                    onChange={(title) =>
                      onTodosChange(
                        todos.map((item) =>
                          item.id === todo.id ? { ...item, title } : item,
                        ),
                      )
                    }
                    inputClassName={cn(todo.done && "text-slate-400 line-through")}
                  />
                  {todo.title.includes("*") || todo.title.includes("_") || todo.title.includes("~") ? (
                    <p className="mt-0.5 text-xs text-slate-500">{renderWhatsAppText(todo.title)}</p>
                  ) : null}
                </div>
              </label>
              <input
                type="date"
                className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600"
                value={todo.reminderAt ?? ""}
                onChange={(event) =>
                  onTodosChange(
                    todos.map((item) =>
                      item.id === todo.id ? { ...item, reminderAt: event.target.value } : item,
                    ),
                  )
                }
                aria-label="Recordatorio"
              />
              <button
                type="button"
                onClick={() => onTodosChange(todos.filter((item) => item.id !== todo.id))}
                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                aria-label="Eliminar pendiente"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {todos.length === 0 && (
            <p className="text-sm text-slate-400">No hay pendientes. Agrega el primero.</p>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Links</p>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addLink}>
            <Plus className="h-3.5 w-3.5" />
            Link
          </Button>
        </div>
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                <WikiWhatsAppInput
                  value={link.title}
                  onChange={(title) =>
                    onLinksChange(
                      links.map((item) =>
                        item.id === link.id ? { ...item, title } : item,
                      ),
                    )
                  }
                  placeholder="Título"
                  inputClassName="font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => onLinksChange(links.filter((item) => item.id !== link.id))}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Eliminar link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/15"
                value={link.url}
                onChange={(event) =>
                  onLinksChange(
                    links.map((item) =>
                      item.id === link.id ? { ...item, url: event.target.value } : item,
                    ),
                  )
                }
                placeholder="https://"
              />
            </li>
          ))}
          {links.length === 0 && (
            <p className="text-sm text-slate-400">No hay links. Agrega documentación o recursos.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
