import {
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
} from "lucide-react";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { inboxChannelMeta } from "@/lib/inbox/channels";
import type { InboxConversation } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const TAG_COLORS: Record<string, string> = {
  Interesado: "bg-blue-100 text-blue-700",
  Muebles: "bg-violet-100 text-violet-700",
  Lima: "bg-emerald-100 text-emerald-700",
  "Hot Lead": "bg-orange-100 text-orange-700",
  Nuevo: "bg-sky-100 text-sky-700",
  Decoración: "bg-pink-100 text-pink-700",
  Corporativo: "bg-indigo-100 text-indigo-700",
};

type InboxContactPanelProps = {
  conversation: InboxConversation | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function InboxContactPanel({ conversation }: InboxContactPanelProps) {
  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-center text-sm text-slate-400">
        Selecciona una conversación para ver el contacto
      </div>
    );
  }

  const { contact } = conversation;
  const tags = contact.tags ?? [];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-slate-100 p-5 text-center">
        <Avatar className="mx-auto h-16 w-16">
          <AvatarFallback className="bg-slate-200 text-lg font-semibold text-slate-700">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="mt-3 text-base font-semibold text-slate-900">{contact.name}</h3>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <ChannelIcon channel={conversation.channel} size="sm" />
          <span className="text-xs text-slate-500">{inboxChannelMeta[conversation.channel].label}</span>
        </div>

        <div className="mt-4 space-y-2 text-left text-sm text-slate-600">
          {contact.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {contact.phone}
            </p>
          )}
          {contact.email && (
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {contact.email}
            </p>
          )}
          {contact.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {contact.location}
            </p>
          )}
        </div>

        {contact.isFrequentClient && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            Cliente frecuente
          </span>
        )}
      </div>

      {(contact.clientSince || contact.totalPurchases || contact.orderCount) && (
        <div className="border-b border-slate-100 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Información adicional
          </h4>
          <dl className="mt-3 space-y-2 text-sm">
            {contact.clientSince && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Cliente desde</dt>
                <dd className="font-medium text-slate-800">{contact.clientSince}</dd>
              </div>
            )}
            {contact.totalPurchases && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Total de compras</dt>
                <dd className="font-medium text-slate-800">{contact.totalPurchases}</dd>
              </div>
            )}
            {contact.orderCount !== undefined && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Pedidos</dt>
                <dd className="font-medium text-slate-800">{contact.orderCount}</dd>
              </div>
            )}
          </dl>
          <Button variant="outline" size="sm" className="mt-3 h-8 w-full text-xs">
            Ver perfil completo
          </Button>
        </div>
      )}

      {contact.previousConversations && contact.previousConversations.length > 0 && (
        <div className="border-b border-slate-100 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Conversaciones anteriores
          </h4>
          <ul className="mt-3 space-y-2">
            {contact.previousConversations.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                >
                  <ChannelIcon channel={item.channel} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.date}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tags.length > 0 && (
        <div className="border-b border-slate-100 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etiquetas</h4>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notas internas</h4>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-blue-600">
            <Plus className="h-3.5 w-3.5" />
            Nueva nota
          </Button>
        </div>
        <ul className="mt-3 space-y-3">
          {(contact.internalNotes ?? []).map((note) => (
            <li key={note.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm leading-relaxed text-slate-700">{note.body}</p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {note.author} · {note.date}
              </p>
            </li>
          ))}
          {(contact.internalNotes ?? []).length === 0 && (
            <p className="text-xs text-slate-400">Sin notas internas</p>
          )}
        </ul>
      </div>
    </div>
  );
}
