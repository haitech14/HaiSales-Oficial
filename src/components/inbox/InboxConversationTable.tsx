import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { inboxPriorityMeta, inboxStageMeta } from "@/lib/inbox/channels";
import type { InboxConversation } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

function formatConversationDate(isoDate: string) {
  try {
    return format(parseISO(isoDate), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return isoDate;
  }
}

export function InboxConversationTable({ conversations }: { conversations: InboxConversation[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Fecha
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Contacto
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Identificador
            </TableHead>
            <TableHead className="min-w-[220px] text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Último mensaje
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Etapa
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Prioridad
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Asesor
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                No hay conversaciones con los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((conversation) => (
              <TableRow key={conversation.id} className="hover:bg-slate-50/60">
                <TableCell className="whitespace-nowrap text-xs text-slate-600">
                  {formatConversationDate(conversation.lastMessageAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={conversation.channel} size="sm" />
                    <span className="text-sm font-medium text-slate-900">
                      {conversation.contact.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-slate-500">
                  {conversation.contact.identifier}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600">
                      {conversation.lastMessage}
                    </p>
                    {conversation.isRead && (
                      <CheckCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      inboxStageMeta[conversation.stage].badgeClass,
                    )}
                  >
                    {inboxStageMeta[conversation.stage].label}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-xs font-semibold capitalize",
                      inboxPriorityMeta[conversation.priority],
                    )}
                  >
                    {conversation.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {conversation.advisorInitials}
                    </span>
                    <span className="text-xs text-slate-700">{conversation.advisor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={conversation.channel} size="sm" />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        conversation.status === "activa" ? "text-emerald-600" : "text-slate-400",
                      )}
                    >
                      {conversation.status === "activa" ? "Activa" : "Cerrada"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
