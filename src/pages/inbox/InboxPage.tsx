import {
  Bell,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { InboxAnalyticsSidebar } from "@/components/inbox/InboxAnalyticsSidebar";
import { InboxChannelIntegrations } from "@/components/inbox/InboxChannelIntegrations";
import { InboxConversationTable } from "@/components/inbox/InboxConversationTable";
import { InboxKpiCards } from "@/components/inbox/InboxKpiCards";
import { NuevaCampanaWhatsAppModal } from "@/components/inbox/NuevaCampanaWhatsAppModal";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInbox } from "@/hooks/useInbox";
import { INBOX_CHANNEL_ORDER, inboxChannelMeta, inboxTabs } from "@/lib/inbox/channels";
import type { InboxChannel } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function InboxPage() {
  const {
    snapshot,
    filteredConversations,
    filters,
    setFilters,
    advisors,
    channelConnections,
    showSidebar,
    setShowSidebar,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt,
  } = useInbox();

  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [campanaOpen, setCampanaOpen] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredConversations.slice(start, start + PAGE_SIZE);
  }, [filteredConversations, currentPage]);

  const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  if (isLoading || !snapshot) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
        Cargando Inbox...
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inbox</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Centraliza conversaciones de WhatsApp, Facebook, Messenger, TikTok, página web y
              correo electrónico en un solo lugar.
            </p>
            {lastUpdatedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Última sincronización{" "}
                {formatDistanceToNow(lastUpdatedAt, { addSuffix: true, locale: es })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowSidebar((current) => !current)}
            >
              {showSidebar ? (
                <>
                  <PanelRightClose className="mr-2 h-4 w-4" />
                  Ocultar panel
                </>
              ) : (
                <>
                  <PanelRightOpen className="mr-2 h-4 w-4" />
                  Mostrar panel
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIntegrationsOpen(true)}
              title="Integraciones"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </Button>
            <Button
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-500"
              onClick={() => setCampanaOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva campaña
            </Button>
          </div>
        </div>
      </header>

      {"source" in snapshot && snapshot.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.conversations.length} conversaciones sincronizadas
        </div>
      )}

      <NuevaCampanaWhatsAppModal open={campanaOpen} onOpenChange={setCampanaOpen} />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <InboxKpiCards kpis={snapshot.kpis} />

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                {inboxTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => updateFilter("tab", tab.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      filters.tab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1 opacity-80">({tab.count})</span>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    Guardar vista
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    Más filtros
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    placeholder="Buscar por contacto, identificador, asesor, campaña..."
                    className="h-10 pl-9"
                  />
                </div>

                <Select
                  value={filters.channel}
                  onValueChange={(value) =>
                    updateFilter("channel", value as InboxChannel | "all")
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los canales</SelectItem>
                    {INBOX_CHANNEL_ORDER.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        <span className="flex items-center gap-2">
                          <ChannelIcon channel={channel} size="sm" />
                          {inboxChannelMeta[channel].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.advisor}
                  onValueChange={(value) => updateFilter("advisor", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Asesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Asesor: Todos</SelectItem>
                    {advisors.map((advisor) => (
                      <SelectItem key={advisor} value={advisor}>
                        {advisor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => void refresh()}
                  disabled={isFetching}
                >
                  <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                </Button>
              </div>
            </div>

            <InboxConversationTable conversations={paginatedConversations} />

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredConversations.length)} de{" "}
                {filteredConversations.length} conversaciones
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Select defaultValue="10">
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="25">25 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {showSidebar && (
            <InboxAnalyticsSidebar
              stageStats={snapshot.stageStats}
              advisorStats={snapshot.advisorStats}
              pending={snapshot.pending}
              updatedAt={lastUpdatedAt}
              onRefresh={() => void refresh()}
              isRefreshing={isFetching}
            />
          )}
        </div>
      </div>

      <InboxChannelIntegrations
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
        connections={channelConnections}
      />
    </div>
  );
}
