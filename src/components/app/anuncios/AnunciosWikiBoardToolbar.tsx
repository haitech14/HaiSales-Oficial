import {
  AlignLeft,
  CheckSquare,
  Columns3,
  FileUp,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  MessageSquareText,
  MoreHorizontal,
  MoveUpRight,
  Pencil,
  Table2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type WikiBoardToolId =
  | "nota"
  | "enlace"
  | "todo"
  | "linea"
  | "tablero"
  | "columna"
  | "comenta"
  | "tabla"
  | "more"
  | "imagen"
  | "subir"
  | "dibujar"
  | "papelera";

type ToolItem = {
  id: WikiBoardToolId;
  label: string;
  icon: typeof AlignLeft;
  accent?: boolean;
  muted?: boolean;
};

const PRIMARY_TOOLS: ToolItem[] = [
  { id: "nota", label: "Nota", icon: AlignLeft },
  { id: "enlace", label: "Enlace", icon: Link2 },
  { id: "todo", label: "To-do", icon: CheckSquare },
  { id: "linea", label: "Línea", icon: MoveUpRight, muted: true },
  { id: "tablero", label: "Tablero", icon: LayoutGrid, accent: true },
  { id: "columna", label: "Columna", icon: Columns3 },
  { id: "comenta", label: "Comenta", icon: MessageSquareText },
  { id: "tabla", label: "Tabla", icon: Table2 },
  { id: "more", label: "Más", icon: MoreHorizontal, muted: true },
];

const MEDIA_TOOLS: ToolItem[] = [
  { id: "imagen", label: "Imagen", icon: ImageIcon, muted: true },
  { id: "subir", label: "Subir", icon: FileUp, muted: true },
  { id: "dibujar", label: "Dibujar", icon: Pencil, muted: true },
];

type AnunciosWikiBoardToolbarProps = {
  activeTool?: WikiBoardToolId;
  onTool: (id: WikiBoardToolId) => void;
  className?: string;
};

function ToolButton({
  item,
  active,
  onClick,
}: {
  item: ToolItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-pressed={active}
      className="group flex w-full flex-col items-center gap-1"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition",
          active || item.accent
            ? "border-blue-500 bg-blue-500 text-white shadow-blue-500/25"
            : item.muted
              ? "border-slate-200/80 bg-slate-100 text-slate-500"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </span>
      <span
        className={cn(
          "text-[10px] font-medium leading-none",
          active || item.accent ? "text-blue-600" : "text-slate-500",
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

export function AnunciosWikiBoardToolbar({
  activeTool = "tablero",
  onTool,
  className,
}: AnunciosWikiBoardToolbarProps) {
  return (
    <aside
      className={cn(
        "flex w-[72px] shrink-0 flex-col items-center border-r border-slate-200 bg-[#f1f3f6] py-3",
        className,
      )}
      aria-label="Herramientas del mural"
    >
      <div className="flex w-full flex-col items-center gap-3 px-1.5">
        {PRIMARY_TOOLS.map((item) => (
          <ToolButton
            key={item.id}
            item={item}
            active={activeTool === item.id}
            onClick={() => onTool(item.id)}
          />
        ))}
      </div>

      <div className="my-3 h-px w-10 bg-slate-300/80" />

      <div className="flex w-full flex-col items-center gap-3 px-1.5">
        {MEDIA_TOOLS.map((item) => (
          <ToolButton
            key={item.id}
            item={item}
            active={activeTool === item.id}
            onClick={() => onTool(item.id)}
          />
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-3 px-1.5 pt-6">
        <ToolButton
          item={{ id: "papelera", label: "Papelera", icon: Trash2, muted: true }}
          active={activeTool === "papelera"}
          onClick={() => onTool("papelera")}
        />
      </div>
    </aside>
  );
}
