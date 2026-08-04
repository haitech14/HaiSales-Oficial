import { useCallback, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableAutocomplete, type AutocompleteOption } from "@/components/app/SearchableAutocomplete";
import { ProductLineThumb, ProductMultiPicker } from "@/components/app/ProductMultiPicker";
import { NuevoClienteModal } from "@/components/app/NuevoClienteModal";
import { useAuth } from "@/hooks/useAuth";
import { useClientes } from "@/hooks/useClientes";
import type { ClientRecord } from "@/lib/clientes-mock-data";
import type { NuevoClienteFormState } from "@/lib/clientes-form-data";
import { searchClientesForPicker } from "@/lib/clientes/clientes-service";
import {
  readRecentClienteIds,
  rememberRecentClienteId,
} from "@/lib/clientes/recent-clientes";
import { searchHaitechCatalog } from "@/lib/catalogo/haitech-catalog-service";
import {
  ventaEstadosIniciales,
  ventaFormasPago,
  ventaTiposComprobante,
  ventaVendedores,
} from "@/lib/nueva-venta-mock-data";
import {
  isDocumentoInternoForm,
  resolveSerieForTipoForm,
  seriesConfigFromEmpresa,
  seriesOptionsForTipoForm,
} from "@/lib/ventas/comprobantes";
import {
  calculateCartTotals,
  defaultNuevaVentaForm,
  formatVentaCurrency,
  unitPriceForMoneda,
  type NuevaVentaFormData,
  type VentaCartLine,
  type VentaMoneda,
} from "@/lib/nueva-venta-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { configToEmisor, defaultEmpresaConfig } from "@/lib/parametros/empresa-service";

const ventaMonedas = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
] as const;
type NuevaVentaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister?: (form: NuevaVentaFormData) => Promise<void>;
  isSubmitting?: boolean;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
      {children}
      {required && <span className="text-slate-400"> *</span>}
    </label>
  );
}

function PanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ClienteContextSummary({
  cliente,
  clienteRuc,
  contacto,
  oportunidad,
  onClear,
}: {
  cliente: string;
  clienteRuc: string;
  contacto: string;
  oportunidad: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-400">Cliente seleccionado</p>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-medium text-slate-500 transition hover:text-slate-800"
        >
          Cambiar
        </button>
      </div>

      <div className="space-y-2">
        {cliente && (
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-slate-900">{cliente}</p>
            {clienteRuc && <p className="mt-0.5 text-xs text-slate-500">RUC {clienteRuc}</p>}
          </div>
        )}

        {contacto ? (
          <p className="text-xs text-slate-600">{contacto}</p>
        ) : cliente ? (
          <p className="text-xs text-slate-400">Sin contacto</p>
        ) : null}

        {oportunidad ? (
          <p className="text-xs text-slate-600">{oportunidad}</p>
        ) : cliente ? (
          <p className="text-xs text-slate-400">Sin oportunidad</p>
        ) : null}
      </div>
    </div>
  );
}

const fieldControlClass =
  "h-8 w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5";

function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldControlClass, "pr-7")}
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
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function formatContactoLabel(client: ClientRecord) {
  if (!client.contacto || client.contacto === "—") return null;
  if (client.cargo && client.cargo !== "—") {
    return `${client.contacto} — ${client.cargo}`;
  }
  return client.contacto;
}

function createCartLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type VendedorOption = {
  name: string;
  initials: string;
};

function buildVendedorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function mergeVendedores(...lists: VendedorOption[][]): VendedorOption[] {
  const seen = new Set<string>();
  const merged: VendedorOption[] = [];

  for (const list of lists) {
    for (const vendedor of list) {
      const key = vendedor.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({
        name: vendedor.name.trim(),
        initials: vendedor.initials || buildVendedorInitials(vendedor.name),
      });
    }
  }

  return merged;
}

export function NuevaVentaModal({
  open,
  onOpenChange,
  onRegister,
  isSubmitting = false,
}: NuevaVentaModalProps) {
  const [form, setForm] = useState<NuevaVentaFormData>(defaultNuevaVentaForm);
  const [cartLines, setCartLines] = useState<VentaCartLine[]>([]);
  const [contextSearch, setContextSearch] = useState("");
  const [extraVendedores, setExtraVendedores] = useState<VendedorOption[]>([]);
  const [vendedorPopoverOpen, setVendedorPopoverOpen] = useState(false);
  const [nuevoVendedorNombre, setNuevoVendedorNombre] = useState("");
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);

  const { user } = useAuth();
  const { createCliente, isCreating: isCreatingCliente } = useClientes();
  const { data: empresaConfig } = useEmpresaConfig();
  const emisor = useMemo(
    () => configToEmisor(empresaConfig ?? defaultEmpresaConfig),
    [empresaConfig],
  );
  const seriesConfig = useMemo(
    () => seriesConfigFromEmpresa(empresaConfig ?? defaultEmpresaConfig),
    [empresaConfig],
  );
  const serieOptions = useMemo(
    () => seriesOptionsForTipoForm(form.tipoComprobante, seriesConfig),
    [form.tipoComprobante, seriesConfig],
  );

  const totals = useMemo(() => calculateCartTotals(cartLines), [cartLines]);
  const vendedoresOptions = useMemo(
    () => mergeVendedores(ventaVendedores, extraVendedores),
    [extraVendedores],
  );

  const hasClienteResumen = Boolean(form.cliente.trim() || form.oportunidad.trim());

  const loadClienteOptions = useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      const recentIds = readRecentClienteIds(user?.id);
      const rows = await searchClientesForPicker(user?.id ?? null, query, recentIds, 12);
      return rows.map((client) => ({
        value: client.razonSocial,
        label: client.razonSocial,
        hint: client.hint || undefined,
        searchText: client.searchText,
        meta: {
          type: "cliente",
          id: client.id,
          ruc: client.ruc,
          contacto: client.contacto,
        },
      }));
    },
    [user?.id],
  );

  const contextPlaceholder = "Buscar cliente por nombre, RUC o contacto...";

  const updateField = <K extends keyof NuevaVentaFormData>(key: K, value: NuevaVentaFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTipoComprobanteChange = (value: string) => {
    setForm((current) => ({
      ...current,
      tipoComprobante: value,
      serie: resolveSerieForTipoForm(value, seriesConfig),
    }));
  };

  const handleContextSelect = (option: AutocompleteOption) => {
    setContextSearch("");

    const ruc = typeof option.meta?.ruc === "string" ? option.meta.ruc : "";
    const contacto = typeof option.meta?.contacto === "string" ? option.meta.contacto : "";
    const clienteId = typeof option.meta?.id === "string" ? option.meta.id : "";
    if (clienteId) {
      rememberRecentClienteId(user?.id, clienteId);
    }

    setForm((current) => ({
      ...current,
      cliente: option.value,
      clienteRuc: ruc,
      contacto,
    }));
  };

  const applyClienteToForm = (client: ClientRecord) => {
    setContextSearch("");
    rememberRecentClienteId(user?.id, client.id);
    setForm((current) => ({
      ...current,
      cliente: client.razonSocial,
      clienteRuc: client.ruc !== "—" ? client.ruc : "",
      contacto: formatContactoLabel(client) ?? "",
      oportunidad: "",
    }));
  };

  const handleNuevoClienteSubmit = async (
    formData: NuevoClienteFormState,
    mode: "draft" | "create",
  ) => {
    const client = await createCliente({ form: formData, esBorrador: mode === "draft" });
    applyClienteToForm(client);
  };

  const clearClienteContext = () => {
    setContextSearch("");
    setForm((current) => ({
      ...current,
      cliente: "",
      clienteRuc: "",
      contacto: "",
      oportunidad: "",
    }));
  };

  const addProductsToCart = (selectedOptions: AutocompleteOption[]) => {
    if (selectedOptions.length === 0) return;

    setCartLines((current) => {
      const next = [...current];

      for (const option of selectedOptions) {
        const meta = option.meta;
        const codigo = typeof meta?.codigo === "string" ? meta.codigo : "";
        const precioPen =
          typeof meta?.precioPen === "number"
            ? meta.precioPen
            : typeof meta?.precio === "number"
              ? meta.precio
              : 0;
        const precioUsd = typeof meta?.precioUsd === "number" ? meta.precioUsd : 0;
        const precio = unitPriceForMoneda(form.moneda, precioPen, precioUsd, precioPen);
        const unidad = typeof meta?.unidad === "string" ? meta.unidad : "UND";
        const productoId = typeof meta?.productoId === "string" ? meta.productoId : null;
        const imageUrl =
          typeof meta?.imageUrl === "string" && meta.imageUrl ? meta.imageUrl : null;
        const iconBg = typeof meta?.iconBg === "string" ? meta.iconBg : "bg-blue-50";
        const iconColor = typeof meta?.iconColor === "string" ? meta.iconColor : "text-blue-600";
        const iconKind = typeof meta?.iconKind === "string" ? meta.iconKind : "product";
        const nombre = option.label || option.value;

        const existingIndex = next.findIndex(
          (line) =>
            (productoId && line.productoId === productoId) ||
            (line.productoCodigo === codigo && line.producto === nombre),
        );

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            cantidad: next[existingIndex].cantidad + 1,
          };
        } else {
          next.push({
            id: createCartLineId(),
            producto: nombre,
            productoCodigo: codigo,
            productoId,
            cantidad: 1,
            unidad,
            precioUnitario: precio,
            precioPen,
            precioUsd,
            imageUrl,
            iconBg,
            iconColor,
            iconKind,
          });
        }
      }

      return next;
    });

    toast.success(
      selectedOptions.length === 1
        ? "Producto agregado al carrito"
        : `${selectedOptions.length} productos agregados al carrito`,
    );
  };

  const handleMonedaChange = (value: string) => {
    const moneda = (value === "USD" ? "USD" : "PEN") as VentaMoneda;
    updateField("moneda", moneda);
    setCartLines((current) =>
      current.map((line) => ({
        ...line,
        precioUnitario: unitPriceForMoneda(
          moneda,
          line.precioPen,
          line.precioUsd,
          line.precioUnitario,
        ),
      })),
    );
  };

  const handleVendedorChange = (value: string) => {
    const vendedor = vendedoresOptions.find((item) => item.name === value);
    updateField("vendedor", value);
    updateField("vendedorInitials", vendedor?.initials ?? buildVendedorInitials(value));
  };

  const handleAddVendedor = () => {
    const name = nuevoVendedorNombre.trim();
    if (!name) {
      toast.error("Ingresa el nombre del vendedor");
      return;
    }

    const exists = vendedoresOptions.some(
      (vendedor) => vendedor.name.toLowerCase() === name.toLowerCase(),
    );
    const initials = buildVendedorInitials(name);

    if (!exists) {
      setExtraVendedores((current) => [...current, { name, initials }]);
    }

    updateField("vendedor", name);
    updateField("vendedorInitials", initials);
    setNuevoVendedorNombre("");
    setVendedorPopoverOpen(false);
    toast.success(exists ? `Vendedor "${name}" seleccionado` : `Vendedor "${name}" agregado`);
  };

  const resetModal = () => {
    setForm(defaultNuevaVentaForm);
    setCartLines([]);
    setContextSearch("");
    setExtraVendedores([]);
    setNuevoVendedorNombre("");
    setVendedorPopoverOpen(false);
    setNuevoClienteOpen(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetModal();
  };

  const buildFormPayload = (): NuevaVentaFormData => {
    const firstLine = cartLines[0];
    return {
      ...form,
      lineItems: cartLines,
      producto: firstLine?.producto ?? "",
      productoCodigo: firstLine?.productoCodigo ?? "",
      cantidad: firstLine?.cantidad ?? 1,
      unidad: firstLine?.unidad ?? "UND",
      precioUnitario: firstLine?.precioUnitario ?? 0,
    };
  };

  const updateCartLine = (id: string, patch: Partial<VentaCartLine>) => {
    setCartLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const removeCartLine = (id: string) => {
    setCartLines((current) => current.filter((line) => line.id !== id));
  };

  const handleRegistrar = async () => {
    if (!form.cliente.trim()) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (cartLines.length === 0) {
      toast.error("Agrega al menos un producto al carrito");
      return;
    }

    try {
      const payload = buildFormPayload();
      const isInterno = isDocumentoInternoForm(form.tipoComprobante);

      if (!isInterno && onRegister) {
        await onRegister(payload);
      }

      if (form.tipoComprobante === "Cotización") {
        const { generateProformaPdf } = await import("@/lib/pdf/generate-proforma-pdf");
        await generateProformaPdf(payload, emisor);
        toast.success("Cotización PDF generada.");
      } else if (form.tipoComprobante === "Guía de Remisión") {
        const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
        await generateGuiaRemisionPdf(payload, emisor);
        toast.success("Guía de remisión PDF generada.");
      } else {
        const { generateComprobantePdf } = await import("@/lib/pdf/generate-comprobante-pdf");
        await generateComprobantePdf(payload, emisor);
        toast.success("Venta registrada y comprobante PDF generado.");
      }

      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la venta");
    }
  };

  const handleBorrador = () => {
    toast.success("Borrador guardado correctamente.");
  };

  const handleProforma = async () => {
    const { generateProformaPdf } = await import("@/lib/pdf/generate-proforma-pdf");
    await generateProformaPdf(buildFormPayload(), emisor);
    toast.success("Cotización PDF generada.");
  };

  const handleGuiaRemision = async () => {
    const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
    await generateGuiaRemisionPdf(buildFormPayload(), emisor);
    toast.success("Guía de remisión PDF generada.");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="flex max-h-[95vh] max-w-[1080px] flex-col gap-0 overflow-hidden border-slate-200/80 p-0 shadow-xl sm:rounded-2xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900">
                Nueva venta
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-400">
                Completa el comprobante, el cliente y los productos.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:gap-3">
            <div className="min-w-0 flex-1">
              <FieldLabel required>Cliente</FieldLabel>
              <SearchableAutocomplete
                placeholder={contextPlaceholder}
                value={contextSearch}
                loadOptions={loadClienteOptions}
                onChange={setContextSearch}
                onSelect={handleContextSelect}
                onAdd={() => setNuevoClienteOpen(true)}
                emptyMessage="No hay clientes. Usa + para crear uno."
              />
              {hasClienteResumen && (
                <div className="mt-2.5">
                  <ClienteContextSummary
                    cliente={form.cliente}
                    clienteRuc={form.clienteRuc}
                    contacto={form.contacto}
                    oportunidad={form.oportunidad}
                    onClear={clearClienteContext}
                  />
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-end gap-2 sm:gap-2.5 lg:pt-0">
              <div className="min-w-[150px] flex-1 sm:w-[200px] sm:flex-none">
                <FieldLabel required>Tipo de comprobante</FieldLabel>
                <SelectField
                  value={form.tipoComprobante}
                  onChange={handleTipoComprobanteChange}
                  options={ventaTiposComprobante}
                />
              </div>
              <div className="w-[84px] shrink-0">
                <FieldLabel required>Serie</FieldLabel>
                <SelectField
                  value={form.serie}
                  onChange={(value) => updateField("serie", value)}
                  options={serieOptions}
                />
              </div>
              <div className="w-[112px] shrink-0">
                <FieldLabel required>Fecha de emisión</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    value={form.fechaEmision}
                    onChange={(event) => updateField("fechaEmision", event.target.value)}
                    className={cn(fieldControlClass, "pr-7")}
                  />
                  <Calendar className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POS body — producto y carrito */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-100 p-5">
            <PanelSection title="Producto o servicio">
              <ProductMultiPicker
                placeholder="Buscar en haitech.pe o soporte..."
                loadOptions={searchHaitechCatalog}
                onAddSelected={addProductsToCart}
                onAdd={() => toast.info("Agregar nuevo producto")}
              />
            </PanelSection>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {cartLines.length === 0 ? (
              <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <ShoppingCart className="mb-2.5 h-7 w-7 text-slate-300" strokeWidth={1.5} />
                <p className="text-sm font-medium text-slate-500">Carrito vacío</p>
                <p className="mt-0.5 text-xs text-slate-400">Agrega productos desde el buscador</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-400">
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="w-20 px-3 py-2 font-medium">Cant.</th>
                      <th className="w-24 px-3 py-2 font-medium">P. unit.</th>
                      <th className="w-24 px-3 py-2 text-right font-medium">Subtotal</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {cartLines.map((line) => {
                      const lineSubtotal = line.cantidad * line.precioUnitario;
                      return (
                        <tr key={line.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-3 py-2">
                            <ProductLineThumb
                              iconKind={line.iconKind}
                              iconBg={line.iconBg}
                              iconColor={line.iconColor}
                              imageUrl={line.imageUrl}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-800">{line.producto}</p>
                            {line.productoCodigo && (
                              <p className="text-xs text-slate-400">{line.productoCodigo}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.cantidad}
                              onChange={(event) =>
                                updateCartLine(line.id, {
                                  cantidad: Number(event.target.value) || 0,
                                })
                              }
                              className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.precioUnitario}
                              onChange={(event) =>
                                updateCartLine(line.id, {
                                  precioUnitario: Number(event.target.value) || 0,
                                })
                              }
                              className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                            />
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                            {formatVentaCurrency(lineSubtotal, form.moneda)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeCartLine(line.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-50 hover:text-red-500"
                              aria-label="Quitar producto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {cartLines.length} {cartLines.length === 1 ? "ítem" : "ítems"}
              </p>
              <div className="flex items-baseline gap-5 text-sm">
                <span className="text-slate-400">
                  Subtotal{" "}
                  <span className="tabular-nums text-slate-600">
                    {formatVentaCurrency(totals.subtotal, form.moneda)}
                  </span>
                </span>
                <span className="text-slate-400">
                  IGV{" "}
                  <span className="tabular-nums text-slate-600">
                    {formatVentaCurrency(totals.igv, form.moneda)}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatVentaCurrency(totals.total, form.moneda)}
                </span>
              </div>
            </div>

            <div className="grid gap-x-2.5 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel required>Moneda</FieldLabel>
                <SelectField
                  value={form.moneda}
                  onChange={handleMonedaChange}
                  options={[...ventaMonedas]}
                />
              </div>
              <div>
                <FieldLabel required>Forma de pago</FieldLabel>
                <SelectField
                  value={form.formaPago}
                  onChange={(value) => updateField("formaPago", value)}
                  options={ventaFormasPago}
                />
              </div>
              <div>
                <FieldLabel required>Vendedor</FieldLabel>
                <div className="flex gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={form.vendedor}
                      onChange={(event) => handleVendedorChange(event.target.value)}
                      className={cn(fieldControlClass, "pl-8 pr-7")}
                    >
                      {vendedoresOptions.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <Avatar className="pointer-events-none absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2">
                      <AvatarFallback className="bg-slate-100 text-[8px] font-semibold text-slate-600">
                        {form.vendedorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Popover open={vendedorPopoverOpen} onOpenChange={setVendedorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Agregar vendedor"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">Nuevo vendedor</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Agrega un vendedor que no esté en la lista.
                      </p>
                      <Input
                        value={nuevoVendedorNombre}
                        onChange={(event) => setNuevoVendedorNombre(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddVendedor();
                          }
                        }}
                        placeholder="Ej. María Gómez"
                        className="mt-3 h-8 text-xs"
                        autoFocus
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNuevoVendedorNombre("");
                            setVendedorPopoverOpen(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" size="sm" onClick={handleAddVendedor}>
                          Agregar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <FieldLabel required>Estado inicial</FieldLabel>
                <SelectField
                  value={form.estadoInicial}
                  onChange={(value) => updateField("estadoInicial", value)}
                  options={ventaEstadosIniciales}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-3.5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-9 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleBorrador}
            disabled={isSubmitting}
            className="h-9 text-slate-600 hover:bg-slate-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleProforma}
            disabled={isSubmitting}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cotización
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGuiaRemision}
            disabled={isSubmitting}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Guía de remisión
          </Button>
          <Button
            type="button"
            onClick={handleRegistrar}
            disabled={isSubmitting}
            className="h-9 bg-slate-900 px-4 font-medium text-white hover:bg-slate-800"
          >
            {isSubmitting ? "Registrando..." : "Registrar venta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      <NuevoClienteModal
        open={nuevoClienteOpen}
        onOpenChange={setNuevoClienteOpen}
        onSubmit={handleNuevoClienteSubmit}
        isSubmitting={isCreatingCliente}
      />
    </>
  );
}
