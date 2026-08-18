import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
import { hideInboxConversation } from "@/lib/inbox/inbox-service";
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
  onDeleted?: (conversationId: string) => void;
  showSourcePhoneBadge?: boolean;
};

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  showSourcePhoneBadge,
}: {
  conversation: InboxConversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  showSourcePhoneBadge?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
        isSelected && "bg-blue-50 hover:bg-blue-50",
        !conversation.isRead && !isSelected && "bg-slate-50/60",
      )}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-3 text-left">
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
      </button>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {!conversation.isRead && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
            1
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600 group-hover:text-slate-500"
          aria-label={`Eliminar chat de ${conversation.contact.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ConversationSection({
  title,
  count,
  conversations,
  selectedId,
  onSelect,
  onDelete,
  showSourcePhoneBadge,
}: {
  title: string;
  count: number;
  conversations: InboxConversation[];
  selectedId: string | null;
  onSelect: (conversation: InboxConversation) => void;
  onDelete: (conversation: InboxConversation) => void;
  showSourcePhoneBadge?: boolean;
}) {
  if (conversations.length === 0) return null;

  return (
    <div>
      <p className="sticky top-0 z-10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title} ({count})
      </p>
      <ul className="divide-y divide-slate-100">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              onSelect={() => onSelect(conversation)}
              onDelete={() => onDelete(conversation)}
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
  onDeleted,
  showSourcePhoneBadge,
}: InboxConversationListProps) {
  const { assigned, unassigned } = splitConversationsByAssignment(conversations);
  const [pending, setPending] = useState<InboxConversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await hideInboxConversation(pending.id);
      onDeleted?.(pending.id);
      setPending(null);
      toast.success("Chat eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el chat");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 p-3">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <ModuleEmptyState
            compact
            className="min-h-[220px] py-10"
            message="No hay conversaciones con los filtros actuales."
          />
        ) : (
          <>
            <ConversationSection
              title="Asignadas a mí"
              count={assigned.length}
              conversations={assigned}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={setPending}
              showSourcePhoneBadge={showSourcePhoneBadge}
            />
            <ConversationSection
              title="Sin asignar"
              count={unassigned.length}
              conversations={unassigned}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={setPending}
              showSourcePhoneBadge={showSourcePhoneBadge}
            />
          </>
        )}
      </div>

      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && !deleting && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar chat</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará la conversación de {pending?.contact.name ?? "este contacto"} del Inbox. No se
              volverá a mostrar en la lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
