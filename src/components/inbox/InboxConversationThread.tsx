import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Loader2,
  Paperclip,
  Send,
  Smile,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { inboxChannelMeta } from "@/lib/inbox/channels";
import { sendInboxMessage } from "@/lib/inbox/inbox-service";
import type { InboxConversation } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxConversationThreadProps = {
  conversation: InboxConversation;
  canSendWhatsApp?: boolean;
  onMessageSent?: () => void;
};

function formatMessageTime(isoDate: string) {
  try {
    return format(parseISO(isoDate), "h:mm a", { locale: es });
  } catch {
    return "";
  }
}

function formatDateDivider(isoDate: string) {
  try {
    const date = parseISO(isoDate);
    if (isToday(date)) return "Hoy";
    return format(date, "d 'de' MMMM", { locale: es });
  } catch {
    return "Hoy";
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

const contactTypeLabel: Record<NonNullable<InboxConversation["contactType"]>, string> = {
  cliente: "Cliente",
  lead: "Lead",
  prospecto: "Prospecto",
};

export function InboxConversationThread({
  conversation,
  canSendWhatsApp = false,
  onMessageSent,
}: InboxConversationThreadProps) {
  const [composerTab, setComposerTab] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const liveMessages = useInboxMessages(conversation.id);
  const messages = liveMessages.data ?? [];
  const isLoadingMessages = liveMessages.isLoading;

  const channelMeta = inboxChannelMeta[conversation.channel];
  const dateDivider = messages[0] ? formatDateDivider(messages[0].sentAt) : "Hoy";

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || composerTab !== "reply") return;

    if (!canSendWhatsApp || conversation.channel !== "whatsapp") {
      toast.message("Conecta WhatsApp Kapso para enviar mensajes reales.");
      return;
    }

    setIsSending(true);
    try {
      await sendInboxMessage(conversation.id, body);
      setDraft("");
      await liveMessages.refetch();
      onMessageSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f0f2f5]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">
              {getInitials(conversation.contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{conversation.contact.name}</p>
              {conversation.contactType && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {contactTypeLabel[conversation.contactType]}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <ChannelIcon channel={conversation.channel} size="sm" className="h-4 w-4" />
              <span>{channelMeta.label}</span>
              {conversation.sourcePhoneLabel && (
                <>
                  <span>·</span>
                  <span className="truncate">desde {conversation.sourcePhoneLabel}</span>
                </>
              )}
              <span>·</span>
              <span>{formatMessageTime(conversation.lastMessageAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-500">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
            <Clock className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="flex justify-center">
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
            {dateDivider}
          </span>
        </div>

        {isLoadingMessages ? (
          <div className="flex justify-center py-8 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-8 text-sm text-slate-500">
            Sin mensajes todavía. Escribe el primero.
          </div>
        ) : (
          messages.map((message) => {
            const isOutbound = message.direction === "outbound";
            return (
              <div
                key={message.id}
                className={cn("flex", isOutbound ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm",
                    isOutbound
                      ? "rounded-tr-sm bg-[#dbeafe] text-slate-800"
                      : "rounded-tl-sm bg-white text-slate-700",
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.body}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[10px]",
                      isOutbound ? "justify-end text-slate-500" : "text-slate-400",
                    )}
                  >
                    <span>{formatMessageTime(message.sentAt)}</span>
                    {isOutbound && !message.isAutoReply && (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            onClick={() => setComposerTab("reply")}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition",
              composerTab === "reply"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Responder
          </button>
          <button
            type="button"
            onClick={() => setComposerTab("note")}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition",
              composerTab === "note"
                ? "border-b-2 border-amber-500 text-amber-600"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Nota interna
          </button>
        </div>

        <div className="p-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder={composerTab === "reply" ? "Escribe tu mensaje..." : "Escribe una nota interna..."}
            className="min-h-[72px] resize-none border-slate-200 text-sm"
            disabled={isSending}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className={cn(
                  "h-9 gap-1.5 px-4",
                  composerTab === "note"
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-emerald-600 hover:bg-emerald-500",
                )}
                disabled={isSending || !draft.trim() || composerTab !== "reply"}
                onClick={() => void handleSend()}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
