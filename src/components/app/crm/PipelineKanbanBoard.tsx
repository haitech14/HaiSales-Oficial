import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { listCrmOwnerOptions, type CrmOwnerOption } from "@/lib/crm/crm-service";
import {
  buildOwnerInitials,
  isPlaceholderOwner,
  pickHumanContactName,
  looksLikePhone,
  resolveOwnerName,
} from "@/lib/crm/contact-display-name";
import { isGenericLastMessage } from "@/lib/inbox/empty-conversations-cleanup";
import { clienteTipoOptions } from "@/lib/clientes-mock-data";
import { formatPipelineCurrency } from "@/lib/pipeline-mock-data";
import type { PipelineCard, PipelineColumn, PipelineStage } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

const TIPO_ORDER = [
  "publico",
  "gobierno",
  "distribuidor",
  "tecnico",
  "mayorista",
  "proveedor",
  "whatsapp",
  "facebook",
  "instagram",
];

const TIPO_TONE: Record<string, { bar: string; chip: string; header: string }> = {
  publico: { bar: "bg-sky-500", chip: "bg-sky-100 text-sky-700", header: "text-sky-700" },
  distribuidor: { bar: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700", header: "text-indigo-700" },
  tecnico: { bar: "bg-amber-500", chip: "bg-amber-100 text-amber-800", header: "text-amber-700" },
  mayorista: { bar: "bg-violet-500", chip: "bg-violet-100 text-violet-700", header: "text-violet-700" },
  proveedor: { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", header: "text-emerald-700" },
  gobierno: { bar: "bg-rose-500", chip: "bg-rose-100 text-rose-700", header: "text-rose-700" },
  whatsapp: { bar: "bg-green-500", chip: "bg-green-100 text-green-700", header: "text-green-700" },
  facebook: { bar: "bg-blue-500", chip: "bg-blue-100 text-blue-700", header: "text-blue-700" },
  instagram: { bar: "bg-pink-500", chip: "bg-pink-100 text-pink-700", header: "text-pink-700" },
};

const DRAG_THRESHOLD = 6;

function tipoTone(key?: string) {
  return TIPO_TONE[key ?? ""] ?? { bar: "bg-slate-400", chip: "bg-slate-100 text-slate-600", header: "text-slate-600" };
}

function isGenericChannelText(value?: string) {
  const text = value?.trim() ?? "";
  if (!text) return true;
  return /^(lead|contacto|conversaci[oó]n)(\s+(whatsapp|facebook|instagram))?$/i.test(text)
    || /^(whatsapp|facebook|instagram)$/i.test(text)
    || /^oportunidad(\s|$|[—\-:])/i.test(text);
}

function cardDisplayTitle(card: PipelineCard) {
  const named = pickHumanContactName(card.contactName, card.title, card.company);
  if (named) return named;
  const phone = card.contactPhone?.trim();
  if (phone) return phone;
  if (card.title?.trim() && !isGenericChannelText(card.title) && !looksLikePhone(card.title)) {
    return card.title.trim();
  }
  if (card.title?.trim() && !isGenericChannelText(card.title)) return card.title.trim();
  return "Nuevo contacto";
}

function cardDisplayPhone(card: PipelineCard) {
  const phone = card.contactPhone?.trim();
  const title = cardDisplayTitle(card);
  if (phone && phone !== title) return phone;
  const alt = card.intereses?.trim();
  if (alt && looksLikePhone(alt) && alt !== title) return alt;
  return null;
}

function cardDisplayMessage(card: PipelineCard) {
  const message = card.lastMessage?.trim();
  if (!message || isGenericChannelText(message) || isGenericLastMessage(message)) return null;
  return message;
}

function parseMoneyInput(value: string) {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function InlineText({
  value,
  placeholder,
  className,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  className?: string;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  if (!editing) {
    return (
      <button
        type="button"
        data-no-drag
        onClick={(event) => {
          event.stopPropagation();
          setDraft(isGenericChannelText(value) ? "" : value);
          setEditing(true);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn("w-full rounded-md px-0.5 text-left hover:bg-slate-50", className)}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      data-no-drag
      autoFocus
      value={draft}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim();
        setEditing(false);
        if (next && next !== value) onCommit(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          (event.currentTarget as HTMLInputElement).blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn(
        "w-full rounded-md border border-blue-200 bg-white px-1 py-0.5 outline-none ring-2 ring-blue-100",
        className,
      )}
    />
  );
}

function InlinePrice({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value || 0));

  useEffect(() => {
    if (!editing) setDraft(String(value || 0));
  }, [editing, value]);

  if (!editing) {
    return (
      <button
        type="button"
        data-no-drag
        onClick={(event) => {
          event.stopPropagation();
          setDraft(String(value || 0));
          setEditing(true);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="shrink-0 rounded-md px-0.5 text-[13px] font-bold text-blue-600 hover:bg-blue-50"
      >
        {formatPipelineCurrency(value)}
      </button>
    );
  }

  return (
    <input
      data-no-drag
      autoFocus
      inputMode="decimal"
      value={draft}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = parseMoneyInput(draft);
        setEditing(false);
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          (event.currentTarget as HTMLInputElement).blur();
        }
        if (event.key === "Escape") {
          setDraft(String(value || 0));
          setEditing(false);
        }
      }}
      className="w-20 shrink-0 rounded-md border border-blue-200 bg-white px-1 py-0.5 text-right text-[13px] font-bold text-blue-600 outline-none ring-2 ring-blue-100"
    />
  );
}

function formatLastContact(iso?: string, fallback?: string) {
  if (!iso) return fallback || "";
  try {
    const parsed = parseISO(iso);
    const date = Number.isNaN(parsed.getTime()) ? new Date(iso) : parsed;
    if (Number.isNaN(date.getTime())) return fallback || "";
    if (isToday(date)) return format(date, "HH:mm", { locale: es });
    if (isYesterday(date)) return `Ayer ${format(date, "HH:mm", { locale: es })}`;
    return format(date, "dd/MM", { locale: es });
  } catch {
    return fallback || "";
  }
}

function groupCardsByTipo(cards: PipelineCard[]) {
  const groups = new Map<string, { key: string; label: string; cards: PipelineCard[] }>();
  for (const card of cards) {
    const key = card.tipoClienteKey || "publico";
    const label = card.tipoCliente || "Público";
    const current = groups.get(key) ?? { key, label, cards: [] };
    current.cards.push(card);
    groups.set(key, current);
  }

  return [...groups.values()].sort((left, right) => {
    const leftIndex = TIPO_ORDER.indexOf(left.key);
    const rightIndex = TIPO_ORDER.indexOf(right.key);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

function resolveStageFromPoint(clientX: number, clientY: number): PipelineStage | null {
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) return null;
  const stageElement = element.closest("[data-pipeline-stage]");
  if (!stageElement) return null;
  return stageElement.getAttribute("data-pipeline-stage") as PipelineStage | null;
}

function isOverTrash(clientX: number, clientY: number) {
  const element = document.elementFromPoint(clientX, clientY);
  return Boolean(element?.closest("[data-pipeline-trash]"));
}

type DragSession = {
  pointerId: number;
  card: PipelineCard;
  sourceStage: PipelineStage;
  startX: number;
  startY: number;
  moved: boolean;
  ghostWidth: number;
};

type CardPatch = {
  title?: string;
  value?: number;
  owner?: string;
  ownerInitials?: string;
  tipoCliente?: string;
};

type PipelineKanbanBoardProps = {
  columns: PipelineColumn[];
  isLoading?: boolean;
  onSelectCard: (card: PipelineCard) => void;
  onMoveCard: (codigo: string, stage: PipelineStage) => void;
  onEditCard: (card: PipelineCard) => void;
  onDuplicateCard: (card: PipelineCard) => void;
  onDeleteCard: (card: PipelineCard) => void;
  onPatchCard: (card: PipelineCard, patch: CardPatch) => void;
};

function cardChannel(card: PipelineCard): "whatsapp" | "facebook" | "instagram" | null {
  const fuente = (card.fuenteKey ?? "").toLowerCase();
  const badge = card.statusBadge;
  if (badge === "WhatsApp" || fuente === "whatsapp") return "whatsapp";
  if (badge === "Facebook" || fuente === "facebook") return "facebook";
  if (badge === "Instagram" || fuente === "instagram") return "instagram";
  return null;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CardChannelIcon({ card }: { card: PipelineCard }) {
  const channel = cardChannel(card);
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
        <WhatsAppGlyph className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (channel === "facebook") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.6-1.6H17V4.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.6H8v3.2h2.8V22h2.7z" />
        </svg>
      </span>
    );
  }
  if (channel === "instagram") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pink-100 text-pink-600">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2C5.6 4 4 5.6 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8c2 0 3.6-1.6 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm5.5-3.1a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
    </span>
  );
}

function OwnerPicker({
  card,
  owners,
  defaultOwner,
  onAssign,
}: {
  card: PipelineCard;
  owners: CrmOwnerOption[];
  defaultOwner: CrmOwnerOption;
  onAssign?: (owner: CrmOwnerOption) => void;
}) {
  const nombre = resolveOwnerName(card.owner, defaultOwner.nombre);
  const initials = isPlaceholderOwner(card.owner)
    ? defaultOwner.initials
    : card.ownerInitials || buildOwnerInitials(nombre);

  if (!onAssign) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Avatar className="h-5 w-5">
          <AvatarFallback className="bg-blue-100 text-[8px] font-semibold text-blue-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-[11px] font-semibold text-slate-600">{nombre}</span>
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-drag
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="inline-flex min-w-0 max-w-[70%] items-center gap-1.5 rounded-md px-0.5 text-left hover:bg-slate-50"
          aria-label="Asignar responsable"
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-blue-100 text-[8px] font-semibold text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-[11px] font-semibold text-slate-600">{nombre}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52" onClick={(event) => event.stopPropagation()}>
        {owners.map((owner) => (
          <DropdownMenuItem key={owner.id} onSelect={() => onAssign(owner)}>
            <Avatar className="mr-2 h-5 w-5">
              <AvatarFallback className="bg-blue-100 text-[8px] font-semibold text-blue-700">
                {owner.initials}
              </AvatarFallback>
            </Avatar>
            {owner.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TipoClientePicker({
  card,
  onPatch,
}: {
  card: PipelineCard;
  onPatch?: (card: PipelineCard, patch: CardPatch) => void;
}) {
  const tone = tipoTone(card.tipoClienteKey);
  const label = card.tipoCliente || "Público";

  if (!onPatch) {
    return (
      <span className={cn("inline-flex shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.chip)}>
        {label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-drag
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "inline-flex max-w-[118px] shrink-0 items-center gap-0.5 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold transition hover:ring-1 hover:ring-blue-200",
            tone.chip,
          )}
          aria-label="Cambiar tipo de cliente"
          title="Cambiar tipo de cliente"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48" onClick={(event) => event.stopPropagation()}>
        {clienteTipoOptions.map((option) => (
          <DropdownMenuItem
            key={option}
            className={cn(option === label && "font-semibold text-blue-700")}
            onSelect={() => {
              if (option !== label) onPatch(card, { tipoCliente: option });
            }}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KanbanCardBody({
  card,
  showMenu = false,
  editable = false,
  owners = [],
  defaultOwner,
  onEdit,
  onDuplicate,
  onDelete,
  onPatch,
}: {
  card: PipelineCard;
  showMenu?: boolean;
  editable?: boolean;
  owners?: CrmOwnerOption[];
  defaultOwner?: CrmOwnerOption;
  onEdit?: (card: PipelineCard) => void;
  onDuplicate?: (card: PipelineCard) => void;
  onDelete?: (card: PipelineCard) => void;
  onPatch?: (card: PipelineCard, patch: CardPatch) => void;
}) {
  const lastMessage = cardDisplayMessage(card);
  const phone = cardDisplayPhone(card);
  const lastContact = formatLastContact(card.lastContactAt, card.dueDate);
  const tone = tipoTone(card.tipoClienteKey);
  const title = cardDisplayTitle(card);

  return (
    <>
      <span className={cn("w-1.5 shrink-0", tone.bar)} />
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <CardChannelIcon card={card} />
          <TipoClientePicker card={card} onPatch={onPatch} />
          {editable ? (
            <InlineText
              value={title}
              placeholder="Nombre del contacto"
              className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-slate-900"
              onCommit={(next) => onPatch?.(card, { title: next })}
            />
          ) : (
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-slate-900">{title}</p>
          )}
          {showMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-no-drag
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Acciones de la tarjeta"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onSelect={() => onEdit?.(card)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDuplicate?.(card)}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => onDelete?.(card)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {lastMessage ? (
          <p className="mt-1 line-clamp-2 pl-8 text-[12px] leading-snug text-slate-600">{lastMessage}</p>
        ) : phone && phone !== title ? (
          <p className="mt-0.5 truncate pl-8 text-[11px] text-slate-500">{phone}</p>
        ) : null}
        <div className="mt-1.5 flex items-center justify-between gap-2 pl-8">
          <div className="min-w-0 flex-1">
            {defaultOwner ? (
              <OwnerPicker
                card={card}
                owners={owners}
                defaultOwner={defaultOwner}
                onAssign={
                  onPatch
                    ? (owner) => onPatch(card, { owner: owner.nombre, ownerInitials: owner.initials })
                    : undefined
                }
              />
            ) : null}
            <p className="truncate text-[11px] text-slate-500">{lastContact || "Sin contacto"}</p>
          </div>
          {editable ? (
            <InlinePrice value={card.value} onCommit={(next) => onPatch?.(card, { value: next })} />
          ) : (
            <p className="shrink-0 text-[13px] font-bold text-blue-600">{formatPipelineCurrency(card.value)}</p>
          )}
        </div>
      </div>
    </>
  );
}

function PipelineKanbanCard({
  card,
  sourceStage,
  isDragging,
  suppressClick,
  owners,
  defaultOwner,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPatch,
  onPointerDown,
}: {
  card: PipelineCard;
  sourceStage: PipelineStage;
  isDragging?: boolean;
  suppressClick?: boolean;
  owners: CrmOwnerOption[];
  defaultOwner: CrmOwnerOption;
  onSelect: (card: PipelineCard) => void;
  onEdit: (card: PipelineCard) => void;
  onDuplicate: (card: PipelineCard) => void;
  onDelete: (card: PipelineCard) => void;
  onPatch: (card: PipelineCard, patch: CardPatch) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>, card: PipelineCard, sourceStage: PipelineStage) => void;
}) {
  return (
    <article
      data-pipeline-card={card.id}
      onPointerDown={(event) => onPointerDown(event, card, sourceStage)}
      onClick={() => {
        if (suppressClick) return;
        onSelect(card);
      }}
      className={cn(
        "flex touch-none select-none overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300",
        isDragging ? "cursor-grabbing opacity-40" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <KanbanCardBody
        card={card}
        showMenu
        editable
        owners={owners}
        defaultOwner={defaultOwner}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onPatch={onPatch}
      />
    </article>
  );
}

function PipelineKanbanDragGhost({
  card,
  x,
  y,
  width,
  defaultOwner,
}: {
  card: PipelineCard;
  x: number;
  y: number;
  width: number;
  defaultOwner?: CrmOwnerOption;
}) {
  return (
    <div
      className="pointer-events-none fixed z-[100] flex overflow-hidden rounded-xl border border-blue-300 bg-white shadow-lg ring-2 ring-blue-400/30"
      style={{
        left: x,
        top: y,
        width,
        transform: "translate(-50%, -12px)",
      }}
    >
      <KanbanCardBody card={card} defaultOwner={defaultOwner} />
    </div>
  );
}

export function PipelineKanbanBoard({
  columns,
  isLoading,
  onSelectCard,
  onMoveCard,
  onEditCard,
  onDuplicateCard,
  onDeleteCard,
  onPatchCard,
}: PipelineKanbanBoardProps) {
  const { user } = useAuth();
  const { displayName, initials } = useUserProfile();
  const defaultOwner: CrmOwnerOption = {
    id: "current",
    nombre: displayName,
    initials,
  };
  const { data: ownerOptions } = useQuery({
    queryKey: ["crm-owners", user?.id ?? "guest"],
    queryFn: () => listCrmOwnerOptions(user!.id, defaultOwner),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const owners = ownerOptions?.length ? ownerOptions : [defaultOwner];
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PipelineCard | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{ card: PipelineCard; x: number; y: number; width: number } | null>(null);
  const [suppressClick, setSuppressClick] = useState(false);

  const dragSessionRef = useRef<DragSession | null>(null);
  const onMoveCardRef = useRef(onMoveCard);
  onMoveCardRef.current = onMoveCard;

  const endDragSession = useCallback(() => {
    dragSessionRef.current = null;
    setDraggingCardId(null);
    setDragGhost(null);
    setOverStage(null);
    setOverTrash(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>, card: PipelineCard, sourceStage: PipelineStage) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest("[data-no-drag]")) return;

      const cardElement = event.currentTarget;
      dragSessionRef.current = {
        pointerId: event.pointerId,
        card,
        sourceStage,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        ghostWidth: cardElement.getBoundingClientRect().width,
      };

      const onMove = (moveEvent: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || moveEvent.pointerId !== session.pointerId) return;

        const dx = moveEvent.clientX - session.startX;
        const dy = moveEvent.clientY - session.startY;

        if (!session.moved) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          session.moved = true;
          setSuppressClick(true);
          setDraggingCardId(session.card.id);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
        }

        moveEvent.preventDefault();
        setDragGhost({
          card: session.card,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
          width: session.ghostWidth,
        });
        const hoveringTrash = isOverTrash(moveEvent.clientX, moveEvent.clientY);
        setOverTrash(hoveringTrash);
        setOverStage(hoveringTrash ? null : resolveStageFromPoint(moveEvent.clientX, moveEvent.clientY));
      };

      const onUp = (upEvent: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || upEvent.pointerId !== session.pointerId) return;

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        if (session.moved) {
          if (isOverTrash(upEvent.clientX, upEvent.clientY)) {
            setPendingDelete(session.card);
          } else {
            const targetStage = resolveStageFromPoint(upEvent.clientX, upEvent.clientY);
            if (targetStage && targetStage !== session.sourceStage) {
              onMoveCardRef.current(session.card.id, targetStage);
            }
          }
          window.setTimeout(() => setSuppressClick(false), 0);
        }

        endDragSession();
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [endDragSession],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[11px] text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando pipeline...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="grid h-full min-h-0 min-w-[1100px] grid-cols-[repeat(5,minmax(210px,1fr))] grid-rows-[minmax(0,1fr)] gap-3 xl:min-w-0">
          {columns.map((column) => {
            const groups = groupCardsByTipo(column.cards);
            return (
              <div
                key={column.id}
                data-pipeline-stage={column.title}
                className={cn(
                  "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 border-t-[3px] bg-slate-50/60 transition-shadow",
                  column.borderColor,
                  overStage === column.title && "ring-2 ring-blue-400 ring-offset-1",
                )}
              >
                <div className="shrink-0 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("truncate text-sm font-bold", column.headerColor)}>{column.title}</h3>
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                        column.badgeBg,
                      )}
                    >
                      {column.count}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {formatPipelineCurrency(column.totalValue)}
                  </p>
                </div>

                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-y-contain px-2.5 pb-14">
                  {column.cards.length === 0 ? (
                    <p className="px-1 py-10 text-center text-[11px] leading-relaxed text-slate-400">
                      Sin oportunidades en esta etapa.
                    </p>
                  ) : (
                    groups.map((group) => {
                      const tone = tipoTone(group.key);
                      return (
                        <section key={group.key} className="space-y-2">
                          <p className={cn("px-0.5 text-[10px] font-bold uppercase tracking-wide", tone.header)}>
                            {group.label} ({group.cards.length})
                          </p>
                          {group.cards.map((card) => (
                            <PipelineKanbanCard
                              key={card.id}
                              card={card}
                              sourceStage={column.title}
                              isDragging={draggingCardId === card.id}
                              suppressClick={suppressClick}
                              owners={owners}
                              defaultOwner={defaultOwner}
                              onSelect={onSelectCard}
                              onEdit={onEditCard}
                              onDuplicate={onDuplicateCard}
                              onDelete={setPendingDelete}
                              onPatch={onPatchCard}
                              onPointerDown={handleCardPointerDown}
                            />
                          ))}
                        </section>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {draggingCardId ? (
        <div
          data-pipeline-trash
          className={cn(
            "pointer-events-auto fixed bottom-8 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl transition",
            overTrash
              ? "scale-105 bg-red-600 text-white"
              : "border border-red-200 bg-white text-red-600",
          )}
        >
          <Trash2 className="h-5 w-5" />
          {overTrash ? "Soltar para eliminar" : "Papelera"}
        </div>
      ) : null}

      {dragGhost ? (
        <PipelineKanbanDragGhost
          card={dragGhost.card}
          x={dragGhost.x}
          y={dragGhost.y}
          width={dragGhost.width}
          defaultOwner={defaultOwner}
        />
      ) : null}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar oportunidad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar {pendingDelete ? cardDisplayTitle(pendingDelete) : ""}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={() => {
                if (pendingDelete) onDeleteCard(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
