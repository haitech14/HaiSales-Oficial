import {
  Clock3,
  ListChecks,
  MessageCircle,
  Plus,
  SmilePlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MuralApuntesSideToolbarProps = {
  onAddNote?: () => void;
  className?: string;
};

const SIDE_TOOLS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "timer", label: "Temporizador", icon: Clock3 },
  { id: "checklist", label: "Lista", icon: ListChecks },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "feedback", label: "Feedback", icon: SmilePlus },
] as const;

export function MuralApuntesSideToolbar({ onAddNote, className }: MuralApuntesSideToolbarProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-4 top-1/2 z-30 -translate-y-1/2",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Herramientas laterales"
        className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-sm"
      >
        {SIDE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          );
        })}
        <button
          type="button"
          title="Agregar elemento"
          aria-label="Agregar elemento"
          onClick={onAddNote}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
