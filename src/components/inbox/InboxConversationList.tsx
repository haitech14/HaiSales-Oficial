import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Settings2 } from "lucide-react";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { splitConversationsByAssignment } from "@/lib/inbox/mock-data";
import type { InboxConversation } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

function formatListTime(isoDate: string) {
  try {
    return format(parseISO(isoDate), "h:mm a", { locale: es });
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type InboxConversationListProps = {
  conversations: InboxConversation[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (conversation: InboxConversation) => void;
  showSourcePhoneBadge?: boolean;
};

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  showSourcePhoneBadge,
}: {
  conversation: InboxConversation;
  isSelected: boolean;
  onSelect: () => void;
  showSourcePhoneBadge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
        isSelected && "bg-blue-50 hover:bg-blue-50",
        !conversation.isRead && !isSelected && "bg-slate-50/60",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">
            {getInitials(conversation.contact.name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5">
          <ChannelIcon channel={conversation.channel} size="sm" className="h-5 w-5 rounded-full ring-2 ring-white" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              !conversation.isRead ? "font-bold text-slate-900" : "font-medium text-slate-800",
            )}
          >
            {conversation.contact.name}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatListTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{conversation.lastMessage}</p>
        {showSourcePhoneBadge && conversation.sourcePhoneLabel && (
          <p className="mt-1 truncate text-[10px] font-medium text-emerald-700">
            {conversation.sourcePhoneLabel}
          </p>
        )}
      </div>

      {!conversation.isRead && (
        <span className="mt-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
          1
        </span>
      )}
    </button>
  );
}

function ConversationSection({
  title,
  count,
  conversations,
  selectedId,
  onSelect,
  showSourcePhoneBadge,
}: {
  title: string;
  count: number;
  conversations: InboxConversation[];
  selectedId: string | null;
  onSelect: (conversation: InboxConversation) => void;
  showSourcePhoneBadge?: boolean;
}) {
  if (conversations.length === 0) return null;

  return (
    <div>
      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title} ({count})
      </p>
      <ul className="divide-y divide-slate-100">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              onSelect={() => onSelect(conversation)}
              showSourcePhoneBadge={showSourcePhoneBadge}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InboxConversationList({
  conversations,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  showSourcePhoneBadge,
}: InboxConversationListProps) {
  const { assigned, unassigned } = splitConversationsByAssignment(conversations);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar conversaciones..."
            className="h-9 pr-9 text-sm"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Filtros de búsqueda"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-slate-500">
            No hay conversaciones con los filtros actuales.
          </div>
        ) : (
          <>
            <ConversationSection
              title="Asignadas a mí"
              count={assigned.length}
              conversations={assigned}
              selectedId={selectedId}
              onSelect={onSelect}
              showSourcePhoneBadge={showSourcePhoneBadge}
            />
            <ConversationSection
              title="Sin asignar"
              count={unassigned.length}
              conversations={unassigned}
              selectedId={selectedId}
              onSelect={onSelect}
              showSourcePhoneBadge={showSourcePhoneBadge}
            />
          </>
        )}
      </div>

      {conversations.length > 0 && (
        <div className="border-t border-slate-100 p-3 text-center">
          <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
            Ver más conversaciones
          </button>
        </div>
      )}
    </div>
  );
}
