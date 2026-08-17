import { useMemo, useState } from "react";
import { Loader2, Plug } from "lucide-react";
import { InboxChannelIntegrations } from "@/components/inbox/InboxChannelIntegrations";
import { InboxFilterBar } from "@/components/inbox/InboxFilterBar";
import { InboxMessengerView } from "@/components/inbox/InboxMessengerView";
import { WhatsAppNumberSelector } from "@/components/inbox/WhatsAppNumberSelector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useInbox } from "@/hooks/useInbox";
import { inboxViewTabs } from "@/lib/inbox/channels";
import type { InboxViewFilter } from "@/lib/inbox/types";

export function PipelineInboxView() {
  const { user } = useAuth();
  const {
    snapshot,
    filteredConversations,
    filters,
    setFilters,
    channelConnections,
    whatsappConnections,
    whatsappConnectionFilter,
    setWhatsappConnectionFilter,
    isLoading,
    invalidate,
  } = useInbox();

  const [contactPanelHidden, setContactPanelHidden] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const filterTabs = useMemo(() => {
    const conversations = snapshot?.conversations ?? [];
    return inboxViewTabs
      .filter((tab) => tab.id !== "team-chat")
      .map((tab) => {
        if (tab.id === "all") {
          return { ...tab, count: conversations.length };
        }
        if (tab.id === "unread") {
          return { ...tab, count: conversations.filter((item) => !item.isRead).length };
        }
        return {
          ...tab,
          count: conversations.filter((item) => item.channel === tab.id).length,
        };
      });
  }, [snapshot?.conversations]);

  const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const hasMessagingConnected =
    channelConnections.some((item) => item.channel === "zavu" && item.status === "connected") ||
    whatsappConnections.some((item) => item.status === "connected");
  const showWhatsAppSelector =
    hasMessagingConnected &&
    (filters.view === "all" || filters.view === "whatsapp" || filters.view === "unread");

  if (isLoading || !snapshot) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando conversaciones...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {snapshot.source === "supabase" && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-700 sm:px-6">
          <span>
            {snapshot.conversations.length} conversaciones
            {hasMessagingConnected ? " · Zavu conectado" : " · Conecta Zavu en Integraciones"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-emerald-200 bg-white text-[11px] text-emerald-800"
            onClick={() => setIntegrationsOpen(true)}
          >
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            Integraciones
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <InboxFilterBar
          tabs={filterTabs}
          activeView={filters.view}
          onViewChange={(view: InboxViewFilter) => updateFilter("view", view)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showWhatsAppSelector && (
            <WhatsAppNumberSelector
              connections={whatsappConnections}
              value={whatsappConnectionFilter}
              onChange={setWhatsappConnectionFilter}
            />
          )}

          <div className="min-h-0 flex-1 overflow-hidden">
            <InboxMessengerView
              conversations={filteredConversations}
              search={filters.search}
              onSearchChange={(search) => updateFilter("search", search)}
              activeView={filters.view}
              contactPanelHidden={contactPanelHidden}
              useLiveMessaging={hasMessagingConnected}
              showSourcePhoneBadge={whatsappConnectionFilter === "all" && hasMessagingConnected}
              onMessageSent={invalidate}
            />
          </div>
        </div>
      </div>

      <InboxChannelIntegrations
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
        connections={channelConnections}
        whatsappConnections={whatsappConnections}
        userId={user?.id}
        onConnectionsChange={invalidate}
      />
    </div>
  );
}
