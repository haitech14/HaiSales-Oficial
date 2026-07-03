import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Hash, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTeamChat } from "@/hooks/useTeamChat";
import { teamChatChannels, type TeamChatChannel } from "@/lib/inbox/team-chat-data";
import { cn } from "@/lib/utils";

type InboxTeamChatViewProps = {
  activeChannel: TeamChatChannel;
  onChannelChange: (channel: TeamChatChannel) => void;
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

export function InboxTeamChatView({ activeChannel, onChannelChange }: InboxTeamChatViewProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { messages, countsByChannel, sendMessage } = useTeamChat(activeChannel);
  const activeMeta = teamChatChannels.find((item) => item.id === activeChannel)!;
  const dateDivider = messages[0] ? formatDateDivider(messages[0].sentAt) : "Hoy";

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setIsSending(true);
    sendMessage(body);
    setDraft("");
    setIsSending(false);
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white sm:w-[280px] lg:w-[300px]">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Chat de equipo</p>
          <p className="mt-0.5 text-xs text-slate-500">Canales internos</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {teamChatChannels.map((channel) => {
            const isActive = channel.id === activeChannel;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onChannelChange(channel.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                  isActive
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100",
                )}
                style={isActive ? { backgroundColor: channel.color } : undefined}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{channel.label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {countsByChannel[channel.id]}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f0f2f5]">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-slate-900">#{activeMeta.label.toLowerCase()}</p>
          <p className="mt-0.5 text-xs text-slate-500">{activeMeta.description}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex justify-center">
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
              {dateDivider}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-sm text-slate-500">
              Sin mensajes en este canal. Escribe el primero.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-slate-200 text-[10px] font-semibold text-slate-700">
                    {message.authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">{message.authorName}</span>
                    <span className="text-[10px] text-slate-400">{formatMessageTime(message.sentAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{message.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:px-6">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={`Mensaje en #${activeMeta.label.toLowerCase()}...`}
              className="min-h-[72px] flex-1 resize-none border-slate-200 text-sm"
              disabled={isSending}
            />
            <Button
              className="h-10 shrink-0 bg-blue-600 hover:bg-blue-500"
              disabled={isSending || !draft.trim()}
              onClick={() => void handleSend()}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
