import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripHorizontal, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export type WikiContextAction =
  | "cut"
  | "copy"
  | "duplicate"
  | "trash"
  | "rename"
  | "lock"
  | "bringFront"
  | "sendBack"
  | "toBoard";

type ShortcutKey = { label: string };

type MenuItem =
  | { type: "action"; id: WikiContextAction; label: string; keys?: ShortcutKey[] }
  | { type: "separator" };

const MENU_ITEMS: MenuItem[] = [
  { type: "action", id: "cut", label: "Cortar", keys: [{ label: "Ctrl" }, { label: "X" }] },
  { type: "action", id: "copy", label: "Copiar", keys: [{ label: "Ctrl" }, { label: "C" }] },
  { type: "action", id: "duplicate", label: "Duplicar", keys: [{ label: "Ctrl" }, { label: "D" }] },
  {
    type: "action",
    id: "trash",
    label: "Mover a la papelera",
    keys: [{ label: "Backspace" }],
  },
  { type: "separator" },
  { type: "action", id: "rename", label: "Renombrar", keys: [{ label: "Return" }] },
  { type: "action", id: "lock", label: "Bloquear posición" },
  { type: "separator" },
  { type: "action", id: "bringFront", label: "Traer al frente" },
  { type: "action", id: "sendBack", label: "Enviar al fondo" },
  { type: "action", id: "toBoard", label: "Convertir en tablero" },
];

export type WikiContextMenuState = {
  target: "card" | "column";
  columnId: string;
  cardId?: string;
  cardTitle: string;
  locked?: boolean;
  x: number;
  y: number;
  mode: "below" | "free";
  anchor?: { left: number; top: number; width: number; height: number };
};

type AnunciosWikiContextMenuProps = {
  menu: WikiContextMenuState;
  onChangePosition: (next: Pick<WikiContextMenuState, "x" | "y" | "mode">) => void;
  onAction: (action: WikiContextAction, menu: WikiContextMenuState) => void;
  onClose: () => void;
};

function KeyCap({ label }: { label: string }) {
  return (
    <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
      {label}
    </span>
  );
}

export function AnunciosWikiContextMenu({
  menu,
  onChangePosition,
  onAction,
  onClose,
}: AnunciosWikiContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [createdLabel] = useState(() => {
    const date = new Date().toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `Creado por ti ${date}`;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: MouseEvent) => {
      // Ignora el botón derecho para no cerrar al abrir el menú
      if (event.button === 2) return;
      const target = event.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    // Diferir para no cerrar en el mismo gesto del click derecho
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  const placeBelow = () => {
    if (!menu.anchor) return;
    onChangePosition({
      mode: "below",
      x: menu.anchor.left,
      y: menu.anchor.top + menu.anchor.height + 8,
    });
  };

  const onDragHandleDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: menu.x,
      originY: menu.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      onChangePosition({
        mode: "free",
        x: dragRef.current.originX + (moveEvent.clientX - dragRef.current.startX),
        y: dragRef.current.originY + (moveEvent.clientY - dragRef.current.startY),
      });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      className="fixed z-[80] w-[260px] select-none rounded-xl border border-slate-200 bg-white shadow-xl"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2 py-1.5">
        <button
          type="button"
          onPointerDown={onDragHandleDown}
          className="inline-flex cursor-grab items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 active:cursor-grabbing"
          title="Arrastrar menú libremente"
        >
          <GripHorizontal className="h-3.5 w-3.5" />
          Arrastrar
        </button>
        <button
          type="button"
          onClick={placeBelow}
          disabled={!menu.anchor}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40",
            menu.mode === "below" && "bg-slate-100 text-slate-700",
          )}
          title="Colocar debajo de la tarjeta"
        >
          <Pin className="h-3.5 w-3.5" />
          Debajo
        </button>
      </div>

      <div className="py-1">
        {MENU_ITEMS.map((item, index) => {
          if (item.type === "separator") {
            return <div key={`sep-${index}`} className="my-1 border-t border-slate-100" />;
          }

          const label =
            item.id === "lock"
              ? menu.locked
                ? "Desbloquear posición"
                : "Bloquear posición"
              : item.label;

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onPointerDown={(event) => {
                // Dispara en pointerdown para que no se pierda si el menú se cierra antes del click
                event.preventDefault();
                event.stopPropagation();
                onAction(item.id, menu);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50"
            >
              <span>{label}</span>
              {item.keys && (
                <span className="flex items-center gap-1">
                  {item.keys.map((key) => (
                    <KeyCap key={`${item.id}-${key.label}`} label={key.label} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 border-t border-slate-100 px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          NA
        </span>
        <div className="min-w-0 text-[11px] leading-snug text-slate-500">
          <p className="truncate font-medium text-slate-600">{menu.cardTitle || "Tarjeta"}</p>
          <p>{createdLabel}</p>
          <p>Última modificación hace 1 hora</p>
        </div>
      </div>
    </div>
  );
}
