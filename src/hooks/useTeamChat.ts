import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  appendTeamChatMessage,
  countTeamChatMessagesByChannel,
  loadTeamChatMessages,
  type TeamChatChannel,
  type TeamChatMessage,
} from "@/lib/inbox/team-chat-data";

export function useTeamChat(activeChannel: TeamChatChannel) {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<TeamChatMessage[]>(() => loadTeamChatMessages(userId));
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setMessages(loadTeamChatMessages(userId));
    setVersion((current) => current + 1);
  }, [userId]);

  const channelMessages = useMemo(
    () => messages.filter((message) => message.channel === activeChannel),
    [messages, activeChannel, version],
  );

  const countsByChannel = useMemo(() => countTeamChatMessagesByChannel(messages), [messages, version]);

  const sendMessage = useCallback(
    (body: string) => {
      if (!userId || !body.trim()) return;
      const authorName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Tú";
      const authorInitials = authorName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const next = appendTeamChatMessage(userId, activeChannel, body.trim(), authorName, authorInitials);
      setMessages(next);
      setVersion((current) => current + 1);
    },
    [activeChannel, user, userId],
  );

  return {
    messages: channelMessages,
    countsByChannel,
    sendMessage,
    refresh,
  };
}
