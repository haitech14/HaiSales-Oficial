import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  AlignLeft,
  ArrowUpRight,
  Bell,
  Clock3,
  GripVertical,
  Hand,
  HelpCircle,
  Image as ImageIcon,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Plus,
  Search,
  Shapes,
  Share2,
  SmilePlus,
  StickyNote,
  Type,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { WikiBoardToolId } from "@/components/app/anuncios/AnunciosWikiBoardToolbar";
import { cn } from "@/lib/utils";

const MURAL_TOOLBAR_POS_KEY = "haisales-mural-toolbar-pos";

const COLLABORATORS = [
  { initials: "MF", color: "bg-violet-100 text-violet-700" },
  { initials: "JL", color: "bg-sky-100 text-sky-700" },
  { initials: "CR", color: "bg-rose-100 text-rose-700" },
  { initials: "RM", color: "bg-emerald-100 text-emerald-700" },
];

type MuralApuntesHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function MuralApuntesHeader({
  search,
  onSearchChange,
  className,
}: MuralApuntesHeaderProps) {
  return (
    <header className={cn("shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <StickyNote className="h-5 w-5 text-violet-600" strokeWidth={1.75} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Mural de Apuntes</h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="relative hidden w-48 sm:block lg:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar en el mural..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              2
            </span>
          </button>

          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 sm:flex"
            aria-label="Ayuda"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <div className="hidden items-center sm:flex">
            <div className="flex -space-x-2">
              {COLLABORATORS.map((user) => (
                <Avatar key={user.initials} className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className={cn("text-[10px] font-semibold", user.color)}>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              +4
            </span>
          </div>

          <Button
            type="button"
            className="h-9 gap-1.5 bg-violet-600 px-3 text-sm font-semibold hover:bg-violet-500"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Breadcrumb className="mt-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app/dashboard" className="text-slate-500 hover:text-slate-800">
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-700">Mural de Apuntes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

export type MuralToolbarTool =
  | WikiBoardToolId
  | "seleccion"
  | "mano"
  | "conectores";

type MuralApuntesFloatingToolbarProps = {
  activeTool: MuralToolbarTool;
  onTool: (tool: MuralToolbarTool) => void;
  onAddNote?: () => void;
  containerRef?: RefObject<HTMLElement | null>;
  className?: string;
};

const SIDE_TOOLS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "timer", label: "Temporizador", icon: Clock3 },
  { id: "checklist", label: "Lista", icon: ListChecks },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "feedback", label: "Feedback", icon: SmilePlus },
] as const;

const MAIN_TOOLS: Array<{
  id: MuralToolbarTool;
  label: string;
  icon: typeof MousePointer2;
}> = [
  { id: "seleccion", label: "Seleccionar", icon: MousePointer2 },
  { id: "mano", label: "Mover lienzo", icon: Hand },
  { id: "nota", label: "Nota adhesiva", icon: StickyNote },
  { id: "texto", label: "Texto", icon: Type },
  { id: "dibujar", label: "Dibujar", icon: Pencil },
  { id: "linea", label: "Flecha", icon: ArrowUpRight },
  { id: "cuadrado", label: "Forma", icon: Shapes },
  { id: "conectores", label: "Conectores", icon: AlignLeft },
  { id: "imagen", label: "Imagen", icon: ImageIcon },
  { id: "more", label: "Más", icon: MoreHorizontal },
];

function loadToolbarPosition(): { x: number; y: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MURAL_TOOLBAR_POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function saveToolbarPosition(pos: { x: number; y: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MURAL_TOOLBAR_POS_KEY, JSON.stringify(pos));
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-6 w-px shrink-0 bg-slate-200" aria-hidden />;
}

function ToolButton({
  label,
  isActive,
  onClick,
  children,
  className,
}: {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
        isActive
          ? "bg-violet-100 text-violet-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MuralApuntesFloatingToolbar({
  activeTool,
  onTool,
  onAddNote,
  containerRef,
  className,
}: MuralApuntesFloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() =>
    loadToolbarPosition(),
  );
  const [dragging, setDragging] = useState(false);

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const container = containerRef?.current;
      const toolbar = toolbarRef.current;
      if (!container || !toolbar) return { x, y };
      const pad = 8;
      const maxX = Math.max(pad, container.clientWidth - toolbar.offsetWidth - pad);
      const maxY = Math.max(pad, container.clientHeight - toolbar.offsetHeight - pad);
      return {
        x: Math.min(Math.max(pad, x), maxX),
        y: Math.min(Math.max(pad, y), maxY),
      };
    },
    [containerRef],
  );

  const centerToolbar = useCallback(() => {
    const container = containerRef?.current;
    const toolbar = toolbarRef.current;
    if (!container || !toolbar) return;
    setPosition(
      clampPosition((container.clientWidth - toolbar.offsetWidth) / 2, 16),
    );
  }, [clampPosition, containerRef]);

  useLayoutEffect(() => {
    if (position !== null) return;
    centerToolbar();
  }, [position, centerToolbar]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setPosition((current) => {
        if (!current) return current;
        return clampPosition(current.x, current.y);
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [clampPosition, containerRef]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      setPosition(
        clampPosition(
          drag.originX + (event.clientX - drag.startX),
          drag.originY + (event.clientY - drag.startY),
        ),
      );
    };

    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      setPosition((current) => {
        if (current) saveToolbarPosition(current);
        return current;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clampPosition]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const current = position ?? { x: 16, y: 16 };
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  if (position === null) {
    return (
      <div
        ref={toolbarRef}
        className={cn("pointer-events-none absolute left-0 top-4 z-30 opacity-0", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={toolbarRef}
      className={cn("pointer-events-auto absolute z-30", dragging && "cursor-grabbing", className)}
      style={{ left: position.x, top: position.y }}
    >
      <div
        role="toolbar"
        aria-label="Herramientas del mural"
        className="inline-flex max-w-[calc(100vw-2rem)] items-center gap-0.5 overflow-x-auto rounded-full border border-slate-200 bg-white/95 px-1 py-1 shadow-lg shadow-slate-900/10 backdrop-blur-sm"
      >
        <button
          type="button"
          title="Arrastrar barra de herramientas"
          aria-label="Arrastrar barra de herramientas"
          onPointerDown={beginDrag}
          className={cn(
            "flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing",
            dragging && "cursor-grabbing",
          )}
        >
          <GripVertical className="h-4 w-4" strokeWidth={2} />
        </button>

        <ToolbarDivider />

        {SIDE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <ToolButton key={tool.id} label={tool.label}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </ToolButton>
          );
        })}

        <ToolButton
          label="Agregar elemento"
          onClick={onAddNote}
          className="bg-violet-600 text-white hover:bg-violet-500 hover:text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </ToolButton>

        <ToolbarDivider />

        {MAIN_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive =
            activeTool === tool.id ||
            (tool.id === "cuadrado" &&
              ["cuadrado", "circulo", "triangulo", "poligono"].includes(activeTool)) ||
            (tool.id === "conectores" && activeTool === "linea");

          return (
            <ToolButton
              key={tool.id}
              label={tool.label}
              isActive={isActive}
              onClick={() => onTool(tool.id)}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </ToolButton>
          );
        })}
      </div>
    </div>
  );
}
