import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Laptop,
  Maximize2,
  Minimize2,
  Package,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { WikiWhatsAppTextarea } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import {
  APUNTES_SECTION_THEMES,
  PROCESO_VENTAS_APUNTES_ORDER,
} from "@/lib/anuncios/wiki-proceso-ventas-data";
import { createWikiId, type WikiKanbanCard, type WikiKanbanColumn } from "@/lib/anuncios/wiki-store";
import { renderWhatsAppText } from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

type AnunciosWikiApuntesPanelProps = {
  columns: WikiKanbanColumn[];
  onChange: (columns: WikiKanbanColumn[]) => void;
  onAddSection?: () => void;
  className?: string;
};

const SECTION_ICONS: Record<string, typeof Tag> = {
  Ventas: Tag,
  Productos: Package,
  Equipos: Laptop,
};

function sortApuntesColumns(columns: WikiKanbanColumn[]): WikiKanbanColumn[] {
  const order = PROCESO_VENTAS_APUNTES_ORDER as readonly string[];
  return [...columns].sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    if (ai === -1 && bi === -1) return a.title.localeCompare(b.title);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function ApunteCard({
  card,
  theme,
  onUpdate,
  onRemove,
}: {
  card: WikiKanbanCard;
  theme: (typeof APUNTES_SECTION_THEMES)[string];
  onUpdate: (note: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const body = card.note ?? "";

  return (
    <div
      className={cn(
        "group relative rounded-lg border px-3.5 py-3 shadow-sm transition",
        theme.cardBg,
        theme.cardBorder,
      )}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-white/80 hover:text-rose-500 group-hover:opacity-100"
        aria-label="Eliminar tarjeta"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {editing ? (
        <WikiWhatsAppTextarea
          value={body}
          onChange={onUpdate}
          rows={Math.max(6, body.split("\n").length + 1)}
          hideEmojiPicker
          showPreview={false}
          inputClassName="border-0 bg-transparent px-0 py-0 pr-6 text-[12.5px] leading-[1.65] shadow-none focus:ring-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full pr-5 text-left text-[12.5px] leading-[1.65] text-slate-800 outline-none"
        >
          {body.length > 0 ? renderWhatsAppText(body) : (
            <span className="text-slate-400">Escribe un apunte…</span>
          )}
        </button>
      )}

      {editing && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className={cn("mt-2 text-[11px] font-medium", theme.accent)}
        >
          Listo
        </button>
      )}
    </div>
  );
}

function ApuntesSection({
  column,
  collapsed,
  onToggleCollapse,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  onRemoveSection,
}: {
  column: WikiKanbanColumn;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddCard: () => void;
  onUpdateCard: (cardId: string, note: string) => void;
  onRemoveCard: (cardId: string) => void;
  onRemoveSection: () => void;
}) {
  const theme = APUNTES_SECTION_THEMES[column.title] ?? APUNTES_SECTION_THEMES.Ventas;
  const Icon = SECTION_ICONS[column.title] ?? Tag;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5",
          theme.headerBg,
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-2 text-sm font-semibold", theme.headerText)}>
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{column.title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
            aria-label={collapsed ? "Expandir sección" : "Minimizar sección"}
          >
            {collapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
            aria-label={collapsed ? "Desplegar" : "Contraer"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemoveSection}
            className="rounded p-1 text-slate-400 transition hover:bg-white/70 hover:text-rose-500"
            aria-label="Eliminar sección"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="space-y-2.5 p-3">
          {column.cards.map((card) => (
            <ApunteCard
              key={card.id}
              card={card}
              theme={theme}
              onUpdate={(note) => onUpdateCard(card.id, note)}
              onRemove={() => onRemoveCard(card.id)}
            />
          ))}
          <button
            type="button"
            onClick={onAddCard}
            className={cn(
              "flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-2 text-[12px] font-medium transition hover:border-slate-300 hover:bg-slate-50",
              theme.accent,
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar tarjeta
          </button>
        </div>
      )}
    </section>
  );
}

export function AnunciosWikiApuntesPanel({
  columns,
  onChange,
  onAddSection,
  className,
}: AnunciosWikiApuntesPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const ordered = sortApuntesColumns(
    columns.filter((column) => !column.hideShell && column.title !== "Envíos"),
  );

  const patchColumn = (columnId: string, updater: (column: WikiKanbanColumn) => WikiKanbanColumn) => {
    onChange(columns.map((column) => (column.id === columnId ? updater(column) : column)));
  };

  return (
    <aside
      className={cn(
        "flex h-[min(50vh,520px)] w-full shrink-0 flex-col border-t border-slate-200 bg-[#f7f8fa] lg:h-full lg:w-[min(100%,380px)] lg:border-l lg:border-t-0",
        className,
      )}
    >
      <div className="scrollbar-minimal min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {ordered.map((column) => (
          <ApuntesSection
            key={column.id}
            column={column}
            collapsed={collapsed[column.id] ?? false}
            onToggleCollapse={() =>
              setCollapsed((current) => ({ ...current, [column.id]: !current[column.id] }))
            }
            onAddCard={() =>
              patchColumn(column.id, (current) => ({
                ...current,
                cards: [
                  ...current.cards,
                  {
                    id: createWikiId("kcard"),
                    title: "Nueva tarjeta",
                    note: "Escribe aquí… Usa *negrita* y emojis 👋",
                  },
                ],
              }))
            }
            onUpdateCard={(cardId, note) =>
              patchColumn(column.id, (current) => ({
                ...current,
                cards: current.cards.map((card) =>
                  card.id === cardId ? { ...card, note } : card,
                ),
              }))
            }
            onRemoveCard={(cardId) =>
              patchColumn(column.id, (current) => ({
                ...current,
                cards: current.cards.filter((card) => card.id !== cardId),
              }))
            }
            onRemoveSection={() => onChange(columns.filter((entry) => entry.id !== column.id))}
          />
        ))}

        {ordered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Sin apuntes. Agrega una sección para empezar.
          </div>
        )}
      </div>

      {onAddSection && (
        <div className="shrink-0 border-t border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={onAddSection}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar sección
          </button>
        </div>
      )}
    </aside>
  );
}
