import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignLeft,
  ArrowUpRight,
  CheckSquare,
  Circle,
  Columns3,
  FileUp,
  Hexagon,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  MessageSquareText,
  Pencil,
  Shapes,
  Square,
  Table2,
  Trash2,
  Triangle,
  Type,
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
  | "texto"
  | "cuadrado"
  | "circulo"
  | "triangulo"
  | "poligono"
  | "imagen"
  | "subir"
  | "dibujar"
  | "papelera";

/** Herramientas que se colocan con clic/arrastre en el lienzo */
export const WIKI_PLACE_TOOLS = [
  "texto",
  "cuadrado",
  "circulo",
  "triangulo",
  "poligono",
] as const satisfies readonly WikiBoardToolId[];

export type WikiPlaceToolId = (typeof WIKI_PLACE_TOOLS)[number];

export function isWikiPlaceTool(id: WikiBoardToolId): id is WikiPlaceToolId {
  return (WIKI_PLACE_TOOLS as readonly string[]).includes(id);
}

type ToolItem = {
  id: WikiBoardToolId;
  label: string;
  icon: typeof AlignLeft;
  muted?: boolean;
};

type ToolGroupDef = {
  id: string;
  label: string;
  icon: typeof AlignLeft;
  /** Si se define, clic en el botón principal dispara esta herramienta */
  defaultTool?: WikiBoardToolId;
  accent?: boolean;
  tools: ToolItem[];
};

const CONTENT_GROUP: ToolGroupDef = {
  id: "contenido",
  label: "Nota",
  icon: AlignLeft,
  defaultTool: "nota",
  tools: [
    { id: "nota", label: "Nota", icon: AlignLeft },
    { id: "enlace", label: "Enlace", icon: Link2 },
    { id: "todo", label: "To-do", icon: CheckSquare },
    { id: "comenta", label: "Comenta", icon: MessageSquareText },
  ],
};

const BOARD_GROUP: ToolGroupDef = {
  id: "tablero",
  label: "Tablero",
  icon: LayoutGrid,
  defaultTool: "tablero",
  accent: true,
  tools: [
    { id: "tablero", label: "Tablero", icon: LayoutGrid },
    { id: "columna", label: "Columna", icon: Columns3 },
    { id: "tabla", label: "Tabla", icon: Table2 },
  ],
};

const TEXT_GROUP: ToolGroupDef = {
  id: "texto",
  label: "Texto",
  icon: Type,
  defaultTool: "texto",
  tools: [{ id: "texto", label: "Texto", icon: Type }],
};

const SHAPE_GROUP: ToolGroupDef = {
  id: "formas",
  label: "Formas",
  icon: Shapes,
  defaultTool: "cuadrado",
  tools: [
    { id: "cuadrado", label: "Cuadrado", icon: Square },
    { id: "circulo", label: "Círculo", icon: Circle },
    { id: "triangulo", label: "Triángulo", icon: Triangle },
    { id: "poligono", label: "Polígono", icon: Hexagon },
    { id: "linea", label: "Flecha", icon: ArrowUpRight },
  ],
};

const MEDIA_GROUP: ToolGroupDef = {
  id: "media",
  label: "Media",
  icon: ImageIcon,
  defaultTool: "imagen",
  tools: [
    { id: "imagen", label: "Imagen", icon: ImageIcon, muted: true },
    { id: "subir", label: "Subir", icon: FileUp, muted: true },
    { id: "dibujar", label: "Dibujar", icon: Pencil, muted: true },
  ],
};

const TOOL_GROUPS: ToolGroupDef[] = [
  CONTENT_GROUP,
  BOARD_GROUP,
  TEXT_GROUP,
  SHAPE_GROUP,
  MEDIA_GROUP,
];

type AnunciosWikiBoardToolbarProps = {
  activeTool?: WikiBoardToolId;
  onTool: (id: WikiBoardToolId) => void;
  className?: string;
};

function FlyoutOption({
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
      title={item.label}
      aria-label={item.label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 transition",
        active ? "bg-blue-50" : "hover:bg-slate-100",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition",
          active
            ? "border-blue-500 bg-blue-500 text-white"
            : item.muted
              ? "border-slate-200 bg-slate-50 text-slate-500"
              : "border-slate-200 bg-white text-slate-700",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </span>
      <span
        className={cn(
          "max-w-[4.5rem] truncate text-[10px] font-medium leading-none",
          active ? "text-blue-600" : "text-slate-500",
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

function ToolGroup({
  group,
  activeTool,
  onTool,
}: {
  group: ToolGroupDef;
  activeTool: WikiBoardToolId;
  onTool: (id: WikiBoardToolId) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const activeChild = group.tools.find((tool) => tool.id === activeTool);
  const hasActive = Boolean(activeChild);
  const DisplayIcon = activeChild?.icon ?? group.icon;
  const displayLabel = activeChild?.label ?? group.label;
  const isSingle = group.tools.length === 1;

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openFlyout = () => {
    clearCloseTimer();
    if (!isSingle) setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      className="relative flex w-full flex-col items-center"
      onMouseEnter={openFlyout}
      onMouseLeave={scheduleClose}
      onFocus={openFlyout}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        title={displayLabel}
        aria-label={displayLabel}
        aria-haspopup={!isSingle ? "menu" : undefined}
        aria-expanded={!isSingle ? open : undefined}
        aria-pressed={hasActive || Boolean(group.accent && activeTool === "tablero")}
        onClick={() => {
          if (group.defaultTool) onTool(group.defaultTool);
          if (!isSingle) setOpen(true);
        }}
        className="group flex w-full flex-col items-center gap-1"
      >
        <span
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition",
            hasActive || group.accent
              ? "border-blue-500 bg-blue-500 text-white shadow-blue-500/25"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <DisplayIcon className="h-4 w-4" strokeWidth={1.85} />
          {!isSingle && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white",
                hasActive || group.accent ? "bg-blue-200" : "bg-slate-300",
              )}
              aria-hidden
            />
          )}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium leading-none",
            hasActive || group.accent ? "text-blue-600" : "text-slate-500",
          )}
        >
          {group.label}
        </span>
      </button>

      {!isSingle && open && (
        <div
          role="menu"
          aria-label={`Opciones de ${group.label}`}
          className="absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2"
          onMouseEnter={openFlyout}
          onMouseLeave={scheduleClose}
        >
          {/* Puente invisible para no cerrar al cruzar el hueco */}
          <div className="absolute -left-3 top-0 h-full w-3" aria-hidden />
          <div className="flex items-stretch gap-0.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
            {group.tools.map((item) => (
              <FlyoutOption
                key={item.id}
                item={item}
                active={activeTool === item.id}
                onClick={() => {
                  onTool(item.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col items-center gap-3 px-1.5">{children}</div>;
}

export function AnunciosWikiBoardToolbar({
  activeTool = "tablero",
  onTool,
  className,
}: AnunciosWikiBoardToolbarProps) {
  return (
    <aside
      className={cn(
        "relative z-40 flex w-[72px] shrink-0 flex-col items-center border-r border-slate-200 bg-[#f1f3f6] py-3",
        className,
      )}
      aria-label="Herramientas del mural"
    >
      <Section>
        {TOOL_GROUPS.map((group) => (
          <ToolGroup
            key={group.id}
            group={group}
            activeTool={activeTool}
            onTool={onTool}
          />
        ))}
      </Section>

      <div className="mt-auto flex w-full flex-col items-center gap-3 px-1.5 pt-6">
        <button
          type="button"
          title="Papelera"
          aria-label="Papelera"
          aria-pressed={activeTool === "papelera"}
          onClick={() => onTool("papelera")}
          className="flex w-full flex-col items-center gap-1"
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition",
              activeTool === "papelera"
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-slate-200/80 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-700",
            )}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.85} />
          </span>
          <span className="text-[10px] font-medium leading-none text-slate-500">
            Papelera
          </span>
        </button>
      </div>
    </aside>
  );
}
