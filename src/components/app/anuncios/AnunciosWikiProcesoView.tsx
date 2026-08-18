import { useState } from "react";
import {
  ChevronRight,
  Info,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  TrendingUp,
} from "lucide-react";
import { AnunciosWikiApuntesPanel } from "@/components/app/anuncios/AnunciosWikiApuntesPanel";
import { Button } from "@/components/ui/button";
import {
  wikiProcesoVentasSteps,
  wikiProcesoVentasTabs,
  type WikiProcesoTabId,
} from "@/lib/anuncios/wiki-proceso-ventas-data";
import { type WikiKanbanColumn, type WikiPage } from "@/lib/anuncios/wiki-store";
import { cn } from "@/lib/utils";

type AnunciosWikiProcesoViewProps = {
  page: WikiPage;
  sectionLabel: string;
  sectionNumber: string;
  onGoHome: () => void;
  onKanbanChange: (columns: WikiKanbanColumn[]) => void;
  onAddKanbanColumn: () => void;
};

export function AnunciosWikiProcesoView({
  page,
  sectionLabel,
  sectionNumber,
  onGoHome,
  onKanbanChange,
  onAddKanbanColumn,
}: AnunciosWikiProcesoViewProps) {
  const [activeTab, setActiveTab] = useState<WikiProcesoTabId>("resumen");
  const [zoom, setZoom] = useState(100);

  const description =
    page.blocks?.find((block) => block.type === "paragraph")?.content ??
    "Aquí encontrarás guías, procedimientos y mejores prácticas para gestionar ventas efectivas.";

  const handleAddSection = () => {
    onAddKanbanColumn();
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Barra superior del contenido */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 sm:px-8">
          <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] text-slate-500">
            <button type="button" onClick={onGoHome} className="transition hover:text-slate-800">
              Inicio
            </button>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            <span className="text-slate-600">
              {sectionNumber}. {sectionLabel}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            <span className="truncate font-medium text-slate-800">{page.title}</span>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-0.5 text-[12px] text-slate-600">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
                onClick={() => setZoom((value) => Math.max(75, value - 10))}
                aria-label="Reducir zoom"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[3rem] text-center font-semibold tabular-nums">{zoom}%</span>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
                onClick={() => setZoom((value) => Math.min(150, value + 10))}
                aria-label="Ampliar zoom"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 bg-[#2563eb] px-3 text-xs font-semibold hover:bg-[#1d4ed8]"
              onClick={handleAddSection}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar sección
            </Button>
          </div>
        </div>

        {/* Contenido principal scrollable */}
        <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Encabezado de página */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{page.title}</h1>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">{description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pestañas */}
            <div className="mt-6 flex flex-wrap gap-2">
              {wikiProcesoVentasTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cuerpo por pestaña */}
            {activeTab === "resumen" ? (
              <div className="mt-6 space-y-3">
                {wikiProcesoVentasSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <article
                      key={step.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-700",
                          step.iconBg,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", step.iconColor)} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Paso {step.number}
                        </p>
                        <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
                        <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{step.description}</p>
                      </div>
                      <button
                        type="button"
                        className="hidden shrink-0 items-center gap-0.5 text-[12px] font-medium text-blue-600 sm:flex"
                      >
                        Ver guía
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </article>
                  );
                })}

                <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Recuerda</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-blue-800/90">
                      Cada interacción con el cliente es una oportunidad. Sé empático, escucha activamente
                      y personaliza tu propuesta según sus necesidades reales.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  {wikiProcesoVentasTabs.find((tab) => tab.id === activeTab)?.label}
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Contenido en preparación. Usa la pestaña Resumen para ver el flujo comercial.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnunciosWikiApuntesPanel
        columns={page.kanbanColumns}
        onChange={onKanbanChange}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
