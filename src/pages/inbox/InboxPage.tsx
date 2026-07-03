import { ChevronDown, Eye, EyeOff, Plug, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DemoDataCleanupBanner } from "@/components/inbox/DemoDataCleanupBanner";
import { InboxChannelIntegrations } from "@/components/inbox/InboxChannelIntegrations";
import { InboxFilterBar } from "@/components/inbox/InboxFilterBar";
import { InboxMessengerView } from "@/components/inbox/InboxMessengerView";
import { InboxTeamChatView } from "@/components/inbox/InboxTeamChatView";
import { NuevaCampanaWhatsAppModal } from "@/components/inbox/NuevaCampanaWhatsAppModal";
import { WhatsAppNumberSelector } from "@/components/inbox/WhatsAppNumberSelector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaSetupStatus } from "@/hooks/useEmpresaConfig";
import { useInbox } from "@/hooks/useInbox";
import { useTeamChat } from "@/hooks/useTeamChat";
import { inboxViewTabs } from "@/lib/inbox/channels";
import type { TeamChatChannel } from "@/lib/inbox/team-chat-data";
import type { InboxViewFilter } from "@/lib/inbox/types";

export default function InboxPage() {
  const { user } = useAuth();
  const { config, isSetupComplete } = useEmpresaSetupStatus();
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
  const [campanaOpen, setCampanaOpen] = useState(false);
  const [teamChatChannel, setTeamChatChannel] = useState<TeamChatChannel>("ventas");
  const [demoBannerHidden, setDemoBannerHidden] = useState(false);

  const { countsByChannel } = useTeamChat(teamChatChannel);
  const teamChatTotal = useMemo(
    () => Object.values(countsByChannel).reduce((sum, count) => sum + count, 0),
    [countsByChannel],
  );

  const filterTabs = useMemo(
    () =>
      inboxViewTabs.map((tab) =>
        tab.id === "team-chat" ? { ...tab, count: teamChatTotal } : tab,
      ),
    [teamChatTotal],
  );

  const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const isSupabaseLive = Boolean(snapshot && "source" in snapshot && snapshot.source === "supabase");
  const hasWhatsAppConnected = whatsappConnections.some((item) => item.status === "connected");
  const isTeamChatView = filters.view === "team-chat";
  const showWhatsAppSelector =
    !isTeamChatView &&
    hasWhatsAppConnected &&
    (filters.view === "all" || filters.view === "whatsapp" || filters.view === "unread");
  const showDemoCleanupBanner =
    Boolean(user?.id) &&
    isSetupComplete &&
    !config.demoCleanupDismissed &&
    !demoBannerHidden;

  if (isLoading || !snapshot) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
        Cargando Inbox...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Inbox</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Gestiona todas tus conversaciones en un solo lugar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setIntegrationsOpen(true)}
            >
              <Plug className="mr-2 h-4 w-4" />
              Integraciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setContactPanelHidden((current) => !current)}
            >
              {contactPanelHidden ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar barra lateral
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar barra lateral
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-500"
              onClick={() => setCampanaOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo mensaje
              <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
            </Button>
          </div>
        </div>
      </header>

      {showDemoCleanupBanner && user?.id && (
        <DemoDataCleanupBanner
          userId={user.id}
          onCleaned={() => {
            setDemoBannerHidden(true);
            invalidate();
          }}
        />
      )}

      {isSupabaseLive && (
        <div className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-6 py-1.5 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.conversations.length} conversaciones sincronizadas
          {hasWhatsAppConnected ? " · WhatsApp Kapso activo" : " · Conecta WhatsApp en Integraciones"}
        </div>
      )}

      <InboxFilterBar
        tabs={filterTabs}
        activeView={filters.view}
        onViewChange={(view: InboxViewFilter) => updateFilter("view", view)}
      />

      {showWhatsAppSelector && (
        <WhatsAppNumberSelector
          connections={whatsappConnections}
          value={whatsappConnectionFilter}
          onChange={setWhatsappConnectionFilter}
        />
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {isTeamChatView ? (
          <InboxTeamChatView activeChannel={teamChatChannel} onChannelChange={setTeamChatChannel} />
        ) : (
          <InboxMessengerView
            conversations={filteredConversations}
            search={filters.search}
            onSearchChange={(search) => updateFilter("search", search)}
            activeView={filters.view}
            contactPanelHidden={contactPanelHidden}
            useLiveWhatsApp={hasWhatsAppConnected}
            showSourcePhoneBadge={whatsappConnectionFilter === "all" && hasWhatsAppConnected}
            onMessageSent={invalidate}
          />
        )}
      </div>

      <NuevaCampanaWhatsAppModal open={campanaOpen} onOpenChange={setCampanaOpen} />

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
