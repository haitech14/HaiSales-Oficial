import { useState } from "react";
import {
  ArrowLeft,
  Calculator,
  Calendar,
  ChevronDown,
  ContactRound,
  History,
  List,
  Search,
  ShoppingBasket,
  Brush,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OutlinedField } from "@/components/app/OutlinedField";
import { SearchableAutocomplete, type AutocompleteOption } from "@/components/app/SearchableAutocomplete";
import { ProductLineThumb, ProductMultiPicker } from "@/components/app/ProductMultiPicker";
import { ventaTiposComprobante } from "@/lib/nueva-venta-mock-data";
import { formatVentaCurrency, type NuevaVentaFormData, type VentaCartLine } from "@/lib/nueva-venta-types";
import type { VentaRecoveryListItem } from "@/lib/ventas/ventas-service";
import { cn } from "@/lib/utils";
import { NuevaVentaOpcionesList } from "./NuevaVentaOpcionesList";
import { NuevaVentaProductosEmptyState } from "./NuevaVentaProductosEmptyState";
import {
  DOC_TIPO_BOLETA,
  DOC_TIPO_FACTURA,
  getComprobanteSubtitle,
  monedaLabel,
  NUEVA_VENTA_MODAL_BG,
  nuevaVentaFieldClass,
  nuevaVentaPlainControlClass,
  ventaTiposOperacion,
} from "./nueva-venta-ui-utils";

const ventaMonedas = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
] as const;

const docTiposProforma = ventaTiposComprobante.filter(
  (tipo) => tipo !== DOC_TIPO_FACTURA && tipo !== DOC_TIPO_BOLETA,
);

type VendedorOption = {
  name: string;
  initials: string;
};

type NuevaVentaModalShellProps = {
  activeTab: "informacion" | "opciones";
  onActiveTabChange: (tab: "informacion" | "opciones") => void;
  form: NuevaVentaFormData;
  cartLines: VentaCartLine[];
  totals: { subtotal: number; igv: number; total: number };
  serieOptions: string[];
  contextSearch: string;
  fechaVencimiento: string;
  tipoOperacion: string;
  descuentoGlobal: string;
  isSubmitting: boolean;
  canProcess: boolean;
  hasClienteResumen: boolean;
  recuperarOpen: boolean;
  recuperarQuery: string;
  recuperarResults: VentaRecoveryListItem[];
  recuperarLoading: boolean;
  recuperandoId: string | null;
  vendedoresOptions: VendedorOption[];
  vendedorPopoverOpen: boolean;
  nuevoVendedorNombre: string;
  onClose: () => void;
  onLimpiar: () => void;
  onFieldChange: <K extends keyof NuevaVentaFormData>(key: K, value: NuevaVentaFormData[K]) => void;
  onTipoComprobanteChange: (value: string) => void;
  onMonedaChange: (value: string) => void;
  onContextSearchChange: (value: string) => void;
  onContextSelect: (option: AutocompleteOption) => void;
  onNuevoCliente: () => void;
  onClearCliente: () => void;
  onFechaVencimientoChange: (value: string) => void;
  onTipoOperacionChange: (value: string) => void;
  onDescuentoGlobalChange: (value: string) => void;
  loadClienteOptions: (query: string) => Promise<AutocompleteOption[]>;
  searchHaitechCatalog: (query: string) => Promise<AutocompleteOption[]>;
  onAddProducts: (options: AutocompleteOption[]) => void;
  onUpdateCartLine: (id: string, patch: Partial<VentaCartLine>) => void;
  onRemoveCartLine: (id: string) => void;
  onVistaPrevia: () => void;
  onProcesar: () => void;
  onBorrador: () => void;
  onProforma: () => void;
  onGuiaRemision: () => void;
  onRecuperarOpenChange: (open: boolean) => void;
  onRecuperarQueryChange: (value: string) => void;
  onRecuperarVenta: (ventaId: string) => void;
  onVendedorChange: (value: string) => void;
  onVendedorPopoverOpenChange: (open: boolean) => void;
  onNuevoVendedorNombreChange: (value: string) => void;
  onAddVendedor: () => void;
  clienteContextSummary: React.ReactNode;
};

function SelectField({
  value,
  onChange,
  options,
  className,
  plain,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  className?: string;
  plain?: boolean;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(plain ? nuevaVentaPlainControlClass : nuevaVentaFieldClass, "pr-9")}
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
          plain ? "right-0" : "right-3",
        )}
      />
    </div>
  );
}

function PanelCard({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </section>
  );
}

export function NuevaVentaModalShell({
  activeTab,
  onActiveTabChange,
  form,
  cartLines,
  totals,
  serieOptions,
  contextSearch,
  fechaVencimiento,
  tipoOperacion,
  descuentoGlobal,
  isSubmitting,
  canProcess,
  hasClienteResumen,
  recuperarOpen,
  recuperarQuery,
  recuperarResults,
  recuperarLoading,
  recuperandoId,
  vendedoresOptions,
  vendedorPopoverOpen,
  nuevoVendedorNombre,
  onClose,
  onLimpiar,
  onFieldChange,
  onTipoComprobanteChange,
  onMonedaChange,
  onContextSearchChange,
  onContextSelect,
  onNuevoCliente,
  onClearCliente,
  onFechaVencimientoChange,
  onTipoOperacionChange,
  onDescuentoGlobalChange,
  loadClienteOptions,
  searchHaitechCatalog,
  onAddProducts,
  onUpdateCartLine,
  onRemoveCartLine,
  onVistaPrevia,
  onProcesar,
  onBorrador,
  onProforma,
  onGuiaRemision,
  onRecuperarOpenChange,
  onRecuperarQueryChange,
  onRecuperarVenta,
  onVendedorChange,
  onVendedorPopoverOpenChange,
  onNuevoVendedorNombreChange,
  onAddVendedor,
  clienteContextSummary,
}: NuevaVentaModalShellProps) {
  const isFactura = form.tipoComprobante === DOC_TIPO_FACTURA;
  const isBoleta = form.tipoComprobante === DOC_TIPO_BOLETA;
  const proformaSelected = !isFactura && !isBoleta;
  const [editingCliente, setEditingCliente] = useState(false);
  const showClienteChip = Boolean(form.cliente.trim()) && !editingCliente && !contextSearch.trim();

  return (
    <DialogContent
      className="flex max-h-[95vh] max-w-[1180px] flex-col gap-0 overflow-hidden border-slate-200/80 p-0 shadow-2xl sm:rounded-2xl [&>button:last-child]:hidden"
      style={{ backgroundColor: NUEVA_VENTA_MODAL_BG }}
      onPointerDownOutside={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('[data-haisales-portal="autocomplete"]')) {
          event.preventDefault();
        }
      }}
      onInteractOutside={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('[data-haisales-portal="autocomplete"]')) {
          event.preventDefault();
        }
      }}
      onFocusOutside={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('[data-haisales-portal="autocomplete"]')) {
          event.preventDefault();
        }
      }}
    >
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Nueva venta
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-500">
                {getComprobanteSubtitle(form.tipoComprobante)}
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            onClick={onLimpiar}
            disabled={isSubmitting}
            className="h-10 shrink-0 gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-600"
          >
            <Brush className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <div className="mt-4 flex gap-6 border-b border-slate-100">
          {(
            [
              { id: "informacion" as const, label: "Información", icon: ContactRound },
              { id: "opciones" as const, label: "Opciones", icon: List },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onActiveTabChange(id)}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-sm font-medium transition",
                  active ? "text-blue-600" : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
                {label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid min-h-[520px] gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-5">
          {activeTab === "informacion" ? (
            <PanelCard title="General">
              <div className="space-y-5 pt-1">
                <OutlinedField label="Cliente" required>
                  {showClienteChip ? (
                    <button
                      type="button"
                      onClick={() => setEditingCliente(true)}
                      className="flex min-w-0 items-center"
                    >
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1.5 pr-1 text-[13px] text-slate-700">
                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{form.cliente}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Quitar cliente"
                          onClick={(event) => {
                            event.stopPropagation();
                            onClearCliente();
                            setEditingCliente(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onClearCliente();
                              setEditingCliente(false);
                            }
                          }}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </span>
                    </button>
                  ) : (
                    <SearchableAutocomplete
                      variant="plain"
                      placeholder="Buscar cliente..."
                      value={contextSearch}
                      loadOptions={loadClienteOptions}
                      onChange={onContextSearchChange}
                      onSelect={(option) => {
                        setEditingCliente(false);
                        onContextSelect(option);
                      }}
                      onAdd={onNuevoCliente}
                      emptyMessage="No hay clientes. Usa + para crear uno."
                    />
                  )}
                </OutlinedField>

                <OutlinedField label="Tipo de documento" required contentClassName="py-2">
                  <div className="flex w-full items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTipoComprobanteChange(DOC_TIPO_FACTURA)}
                      className={cn(
                        "h-9 min-w-0 flex-1 rounded-lg border px-2 text-sm font-medium transition sm:px-3.5",
                        isFactura
                          ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      Factura
                    </button>
                    <button
                      type="button"
                      onClick={() => onTipoComprobanteChange(DOC_TIPO_BOLETA)}
                      className={cn(
                        "h-9 min-w-0 flex-1 rounded-lg border px-2 text-sm font-medium transition sm:px-3.5",
                        isBoleta
                          ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      Boleta
                    </button>
                    <div className="relative min-w-0 flex-[1.2]">
                      <select
                        value={proformaSelected ? form.tipoComprobante : ""}
                        onChange={(event) => {
                          if (event.target.value) {
                            onTipoComprobanteChange(event.target.value);
                          }
                        }}
                        className={cn(
                          "h-9 w-full appearance-none rounded-lg border px-3 pr-8 text-sm transition",
                          proformaSelected
                            ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                            : "border-slate-200 bg-white text-slate-600",
                        )}
                      >
                        <option value="" disabled hidden>
                          Proforma/Nota
                        </option>
                        {!proformaSelected ? (
                          <option value="" disabled>
                            Proforma/Nota
                          </option>
                        ) : null}
                        {docTiposProforma.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo.replace(" (07)", "").replace(" (NV)", "").replace(" (01)", "").replace(" (03)", "")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </OutlinedField>

                <OutlinedField label="Serie" required>
                  <SelectField
                    plain
                    value={form.serie}
                    onChange={(value) => onFieldChange("serie", value)}
                    options={serieOptions}
                  />
                </OutlinedField>

                <OutlinedField label="Moneda y tipo de cambio" required>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 w-full items-center justify-between text-sm text-slate-800"
                      >
                        <span>{monedaLabel(form.moneda)}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">Moneda</p>
                      <div className="mt-2 space-y-1">
                        {ventaMonedas.map((moneda) => (
                          <button
                            key={moneda.value}
                            type="button"
                            onClick={() => onMonedaChange(moneda.value)}
                            className={cn(
                              "flex w-full rounded-lg px-3 py-2 text-left text-sm transition",
                              form.moneda === moneda.value
                                ? "bg-blue-50 font-medium text-blue-700"
                                : "text-slate-700 hover:bg-slate-50",
                            )}
                          >
                            {moneda.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </OutlinedField>

                <div className="grid gap-5 sm:grid-cols-2">
                  <OutlinedField label="Fecha de emisión" required>
                    <input
                      type="text"
                      value={form.fechaEmision}
                      onChange={(event) => onFieldChange("fechaEmision", event.target.value)}
                      className={nuevaVentaPlainControlClass}
                    />
                    <Calendar className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </OutlinedField>
                  <OutlinedField>
                    <input
                      type="text"
                      value={fechaVencimiento}
                      onChange={(event) => onFechaVencimientoChange(event.target.value)}
                      placeholder="Fecha de vencimiento"
                      className={nuevaVentaPlainControlClass}
                    />
                    <Calendar className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </OutlinedField>
                </div>

                <OutlinedField label="Tipo de operación" required>
                  <SelectField
                    plain
                    value={tipoOperacion}
                    onChange={onTipoOperacionChange}
                    options={[...ventaTiposOperacion]}
                  />
                </OutlinedField>

                <OutlinedField>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={descuentoGlobal}
                    onChange={(event) => onDescuentoGlobalChange(event.target.value)}
                    placeholder="Descuento global (%)"
                    className={nuevaVentaPlainControlClass}
                  />
                  <Calculator className="ml-2 h-4 w-4 shrink-0 text-blue-500" />
                </OutlinedField>
              </div>
            </PanelCard>
          ) : (
            <div className="min-h-[520px]">
              <div className="mb-3 flex justify-end">
                <Popover open={recuperarOpen} onOpenChange={onRecuperarOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 gap-1.5 rounded-xl border-blue-200 bg-white text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      <History className="h-3.5 w-3.5" />
                      Recuperar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[min(420px,calc(100vw-2rem))] border-slate-200 p-0"
                    data-haisales-portal="autocomplete"
                  >
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="text-sm font-medium text-slate-900">Recuperar comprobante</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Busca por código, cliente o RUC y carga sus datos en esta venta.
                      </p>
                      <div className="relative mt-2.5">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={recuperarQuery}
                          onChange={(event) => onRecuperarQueryChange(event.target.value)}
                          placeholder="Ej. F001-00012 o MCC IT..."
                          className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                        />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {recuperarLoading ? (
                        <p className="px-3 py-3 text-xs text-slate-500">Buscando comprobantes…</p>
                      ) : recuperarResults.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-slate-500">
                          No hay comprobantes para mostrar.
                        </p>
                      ) : (
                        recuperarResults.map((venta) => (
                          <button
                            key={venta.id}
                            type="button"
                            disabled={recuperandoId === venta.id}
                            onClick={() => onRecuperarVenta(venta.id)}
                            className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-blue-50 disabled:opacity-60"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-slate-800">{venta.codigo}</span>
                              <span className="text-xs font-medium tabular-nums text-slate-600">
                                {formatVentaCurrency(
                                  venta.total,
                                  venta.moneda === "USD" ? "USD" : "PEN",
                                )}
                              </span>
                            </div>
                            <span className="truncate text-xs text-slate-500">
                              {venta.cliente}
                              {venta.clienteRuc ? ` · RUC ${venta.clienteRuc}` : ""}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {venta.fecha}
                              {recuperandoId === venta.id ? " · Cargando…" : ""}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <NuevaVentaOpcionesList
                formaPago={form.formaPago}
                observacionGeneral={form.observacionGeneral}
                onFormaPagoChange={(value) => onFieldChange("formaPago", value)}
                onObservacionChange={(value) => onFieldChange("observacionGeneral", value)}
                onGuiaRemision={onGuiaRemision}
              />
            </div>
          )}

          <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <ShoppingBasket className="h-5 w-5 text-slate-700" />
                  <h3 className="text-base font-semibold text-slate-800">Productos</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Total:{" "}
                  <span className="text-lg font-bold tabular-nums text-blue-600">
                    {formatVentaCurrency(totals.total, form.moneda)}
                  </span>
                </p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="relative z-30 shrink-0 border-b border-slate-100 px-5 py-3">
                  <ProductMultiPicker
                    placeholder="Buscar producto o servicio"
                    loadOptions={searchHaitechCatalog}
                    onAddSelected={onAddProducts}
                    hideFooterAddButton
                    debounceMs={150}
                  />
                </div>

                {cartLines.length === 0 ? (
                  <NuevaVentaProductosEmptyState />
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-slate-100 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-2.5">Producto</th>
                          <th className="w-[88px] px-3 py-2.5">Cant.</th>
                          <th className="w-[110px] px-3 py-2.5">P. unit.</th>
                          <th className="w-[110px] px-3 py-2.5 text-right">Subtotal</th>
                          <th className="w-[56px] px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {cartLines.map((line) => {
                          const lineSubtotal = line.cantidad * line.precioUnitario;
                          return (
                            <tr key={line.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-5 py-3 align-top">
                                <div className="flex items-start gap-3">
                                  <ProductLineThumb
                                    iconKind={line.iconKind}
                                    iconBg={line.iconBg}
                                    iconColor={line.iconColor}
                                    imageUrl={line.imageUrl}
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-800">{line.producto}</p>
                                    {line.productoCodigo ? (
                                      <p className="text-xs text-slate-400">{line.productoCodigo}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={line.cantidad}
                                  onChange={(event) =>
                                    onUpdateCartLine(line.id, {
                                      cantidad: Number(event.target.value) || 0,
                                    })
                                  }
                                  onBlur={() => {
                                    if (line.cantidad < 0.01) {
                                      onUpdateCartLine(line.id, { cantidad: 1 });
                                    }
                                  }}
                                  className={cn(nuevaVentaFieldClass, "h-9 px-2 text-xs")}
                                  aria-label="Cantidad"
                                />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={line.precioUnitario}
                                  onChange={(event) =>
                                    onUpdateCartLine(line.id, {
                                      precioUnitario: Number(event.target.value) || 0,
                                      precioManual: true,
                                    })
                                  }
                                  className={cn(nuevaVentaFieldClass, "h-9 px-2 text-xs")}
                                />
                              </td>
                              <td className="px-3 py-3 align-top text-right tabular-nums font-medium text-slate-700">
                                {formatVentaCurrency(lineSubtotal, form.moneda)}
                              </td>
                              <td className="px-3 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => onRemoveCartLine(line.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                  aria-label="Quitar producto"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onVistaPrevia}
                      disabled={isSubmitting || cartLines.length === 0}
                      className="h-11 rounded-xl border-slate-300 bg-white text-sm font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                    >
                      Vista previa
                    </Button>
                    <Button
                      type="button"
                      onClick={onProcesar}
                      disabled={!canProcess || isSubmitting}
                      className={cn(
                        "h-11 rounded-xl text-sm font-semibold uppercase tracking-wide text-white",
                        canProcess && !isSubmitting
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "cursor-not-allowed bg-slate-300 text-slate-500 hover:bg-slate-300",
                      )}
                    >
                      {isSubmitting ? "Procesando..." : "Procesar"}
                    </Button>
                  </div>
                </div>
              </div>
          </section>
        </div>
      </div>
    </DialogContent>
  );
}
