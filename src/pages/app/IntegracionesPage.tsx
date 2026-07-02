import { useMemo, useState } from "react";
import { Loader2, Plug, Search } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/app/CrmShared";
import { ConectarIntegracionModal } from "@/components/app/ConectarIntegracionModal";
import { Button } from "@/components/ui/button";
import { useIntegraciones } from "@/hooks/useIntegraciones";
import { getIntegracionEstadoStyles, type IntegracionItem } from "@/lib/integraciones-mock-data";
import { cn } from "@/lib/utils";

export default function IntegracionesPage() {
  const { snapshot, isLoading } = useIntegraciones();
  const [search, setSearch] = useState("");
  const [selectedIntegracion, setSelectedIntegracion] = useState<IntegracionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const items = snapshot?.items ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.nombre.toLowerCase().includes(query) ||
        item.descripcion.toLowerCase().includes(query) ||
        item.categoria.toLowerCase().includes(query),
    );
  }, [items, search]);

  const openConnect = (item: IntegracionItem) => {
    setSelectedIntegracion(item);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Integraciones"
        subtitle="Conecta HaiSales con SUNAT, mensajería, bancos, e-commerce y tu ERP."
        actionLabel="+ Nueva integración"
        onActionClick={() => toast.info("Próximamente: catálogo de integraciones")}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {items.length} integraciones sincronizadas
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(snapshot?.kpis ?? []).map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="app-kpi-label">{kpi.label}</p>
                <p className="app-kpi-value mt-2">{kpi.value}</p>
                <p
                  className={cn(
                    "app-kpi-change",
                    kpi.changePositive ? "text-emerald-600" : "text-orange-600",
                  )}
                >
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar integración..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Cargando integraciones...
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        item.iconBg,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", item.iconColor)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {item.categoria}
                          </p>
                          <h3 className="mt-0.5 app-panel-title">{item.nombre}</h3>
                        </div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            getIntegracionEstadoStyles(item.estado),
                          )}
                        >
                          {item.estado}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.descripcion}</p>
                      {item.ultimaSync && (
                        <p className="mt-2 text-xs text-slate-400">Última sync: {item.ultimaSync}</p>
                      )}
                      <Button
                        type="button"
                        variant={item.estado === "Conectado" ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          "mt-4 h-8 gap-2 text-xs",
                          item.estado !== "Conectado" && "bg-blue-600 hover:bg-blue-500",
                        )}
                        onClick={() => openConnect(item)}
                      >
                        <Plug className="h-3.5 w-3.5" />
                        {item.estado === "Conectado" ? "Reconfigurar" : "Conectar"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </div>
      </div>

      <ConectarIntegracionModal
        integracion={selectedIntegracion}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
