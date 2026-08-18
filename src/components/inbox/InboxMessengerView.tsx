import { useEffect, useMemo, useState } from "react";
import { InboxContactPanel } from "@/components/inbox/InboxContactPanel";
import { InboxConversationList } from "@/components/inbox/InboxConversationList";
import { InboxConversationThread } from "@/components/inbox/InboxConversationThread";
import { canSendConversation } from "@/lib/inbox/messaging-providers";
import type { InboxConversation, InboxViewFilter } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxMessengerViewProps = {
  conversations: InboxConversation[];
  search: string;
  onSearchChange: (value: string) => void;
  activeView: InboxViewFilter;
  contactPanelHidden: boolean;
  useLiveMessaging?: boolean;
  showSourcePhoneBadge?: boolean;
  onMessageSent?: () => void;
};

export function InboxMessengerView({
  conversations,
  search,
  onSearchChange,
  activeView,
  contactPanelHidden,
  useLiveMessaging = false,
  showSourcePhoneBadge = false,
  onMessageSent,
}: InboxMessengerViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const visibleConversations = useMemo(
    () => conversations.filter((item) => !hiddenIds.includes(item.id)),
    [conversations, hiddenIds],
  );

  const selectedConversation = useMemo(
    () => visibleConversations.find((item) => item.id === selectedId) ?? visibleConversations[0] ?? null,
    [visibleConversations, selectedId],
  );

  useEffect(() => {
    if (visibleConversations.length === 0) {
      setSelectedId(null);
      return;
    }
    const isDesktop = window.matchMedia("(min-width: 640px)").matches;
    if (!selectedId || !visibleConversations.some((item) => item.id === selectedId)) {
      if (isDesktop) {
        setSelectedId(visibleConversations[0].id);
      } else {
        setSelectedId(null);
      }
    }
  }, [visibleConversations, selectedId]);

  const threadContent = selectedConversation ? (
    <InboxConversationThread
      conversation={selectedConversation}
      canSendLive={
        useLiveMessaging &&
        canSendConversation(selectedConversation.provider, selectedConversation.channel, selectedConversation.externalId)
      }
      onMessageSent={onMessageSent}
    />
  ) : (
    <div className="flex h-full flex-1 items-center justify-center bg-[#f0f2f5] px-6 text-center text-sm text-slate-500">
      Selecciona una conversación para comenzar
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div
        className={cn(
          "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-slate-200 bg-white sm:w-[280px] sm:max-w-[30%] sm:shrink-0 lg:w-[300px]",
          selectedConversation ? "hidden sm:flex" : "flex",
        )}
      >
        <InboxConversationList
          conversations={visibleConversations}
          selectedId={selectedConversation?.id ?? null}
          search={search}
          onSearchChange={onSearchChange}
          onSelect={(conversation) => setSelectedId(conversation.id)}
          onDeleted={(conversationId) => {
            setHiddenIds((current) => [...current, conversationId]);
            onMessageSent?.();
          }}
          showSourcePhoneBadge={showSourcePhoneBadge}
        />
      </div>

      <div
        className={cn(
          "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          selectedConversation ? "flex" : "hidden sm:flex",
        )}
      >
        {selectedConversation && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="shrink-0 border-b border-slate-200 px-4 py-2 text-left text-xs font-medium text-blue-600 sm:hidden"
          >
            ← Volver a conversaciones
          </button>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{threadContent}</div>
      </div>

      <div
        className={cn(
          "hidden w-[300px] shrink-0 border-l border-slate-200 xl:block",
          contactPanelHidden && "xl:hidden",
        )}
      >
        <InboxContactPanel conversation={selectedConversation} />
      </div>
    </div>
  );
}
