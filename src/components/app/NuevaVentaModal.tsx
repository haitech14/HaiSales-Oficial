import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Package,
  Plus,
  ShoppingCart,
  Target,
  Trash2,
  User,
  UserRound,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableAutocomplete, type AutocompleteOption } from "@/components/app/SearchableAutocomplete";
import { ProductLineThumb, ProductMultiPicker } from "@/components/app/ProductMultiPicker";
import { useClientes } from "@/hooks/useClientes";
import { useInventario } from "@/hooks/useInventario";
import type { ClientRecord } from "@/lib/clientes-mock-data";
import {
  ventaClientes,
  ventaEstadosIniciales,
  ventaFormasPago,
  ventaOportunidades,
  ventaProductos,
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
  type NuevaVentaFormData,
  type VentaCartLine,
} from "@/lib/nueva-venta-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { configToEmisor, defaultEmpresaConfig } from "@/lib/parametros/empresa-service";

type NuevaVentaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister?: (form: NuevaVentaFormData) => Promise<void>;
  isSubmitting?: boolean;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-600">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function PanelSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      </div>
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
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resumen</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
        >
          Cambiar
        </button>
      </div>

      <div className="space-y-2.5">
        {cliente && (
          <div className="flex gap-2.5">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-slate-900">{cliente}</p>
              {clienteRuc && <p className="text-xs text-slate-500">RUC {clienteRuc}</p>}
            </div>
          </div>
        )}

        {contacto ? (
          <div className="flex gap-2.5 text-sm text-slate-700">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{contacto}</span>
          </div>
        ) : cliente ? (
          <div className="flex gap-2.5 text-sm text-slate-400">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Sin contacto registrado</span>
          </div>
        ) : null}

        {oportunidad ? (
          <div className="flex gap-2.5 text-sm text-slate-700">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
            <span>{oportunidad}</span>
          </div>
        ) : cliente ? (
          <div className="flex gap-2.5 text-sm text-slate-400">
            <Target className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Sin oportunidad vinculada</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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

export function NuevaVentaModal({
  open,
  onOpenChange,
  onRegister,
  isSubmitting = false,
}: NuevaVentaModalProps) {
  const [form, setForm] = useState<NuevaVentaFormData>(defaultNuevaVentaForm);
  const [cartLines, setCartLines] = useState<VentaCartLine[]>([]);
  const [contextSearch, setContextSearch] = useState("");

  const { snapshot } = useClientes();
  const { data: inventarioSnapshot } = useInventario();
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

  const hasClienteResumen = Boolean(form.cliente.trim() || form.oportunidad.trim());

  const clienteContextOptions = useMemo<AutocompleteOption[]>(() => {
    const options: AutocompleteOption[] = [];
    const clients = snapshot?.clients ?? [];

    if (clients.length > 0) {
      for (const client of clients) {
        const contacto = formatContactoLabel(client);
        options.push({
          value: client.razonSocial,
          label: client.razonSocial,
          hint: [client.ruc !== "—" ? `RUC ${client.ruc}` : null, contacto].filter(Boolean).join(" · "),
          searchText: `${client.ruc} ${client.contacto} ${client.correo} ${client.telefono} ${client.razonSocial} ${client.ciudad}`,
          meta: {
            type: "cliente",
            ruc: client.ruc !== "—" ? client.ruc : "",
            contacto: contacto ?? "",
          },
        });
      }
    } else {
      for (const client of ventaClientes) {
        options.push({
          value: client.label,
          label: client.label,
          hint: `RUC ${client.ruc}`,
          searchText: client.ruc,
          meta: { type: "cliente", ruc: client.ruc, contacto: "" },
        });
      }
    }

    for (const oportunidad of ventaOportunidades) {
      options.push({
        value: oportunidad,
        label: oportunidad,
        hint: "Oportunidad",
        searchText: oportunidad,
        meta: { type: "oportunidad" },
      });
    }

    return options;
  }, [snapshot?.clients]);

  const contextPlaceholder = form.cliente.trim()
    ? "Buscar oportunidad para vincular..."
    : "Buscar cliente, contacto u oportunidad...";

  const productoOptions = useMemo<AutocompleteOption[]>(() => {
    const inventarioProducts = inventarioSnapshot?.products ?? [];
    if (inventarioProducts.length > 0) {
      return inventarioProducts.map((product) => ({
        value: product.name,
        label: product.name,
        hint: `${product.sku} · ${formatVentaCurrency(product.price)}`,
        searchText: `${product.sku} ${product.marca} ${product.category}`,
        meta: {
          codigo: product.sku,
          precio: product.price,
          unidad: product.unit || "UND",
          productoId: product.id,
          iconBg: product.iconBg,
          iconColor: product.iconColor,
          iconKind: product.type,
        },
      }));
    }

    return ventaProductos.map((product) => {
      const isService = product.codigo.startsWith("SRV");
      return {
        value: product.label,
        label: product.label,
        hint: `${product.codigo} · ${formatVentaCurrency(product.precio)}`,
        searchText: product.codigo,
        meta: {
          codigo: product.codigo,
          precio: product.precio,
          unidad: "UND",
          productoId: null,
          iconBg: isService ? "bg-violet-50" : "bg-blue-50",
          iconColor: isService ? "text-violet-600" : "text-blue-600",
          iconKind: isService ? "service" : "product",
        },
      };
    });
  }, [inventarioSnapshot?.products]);

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

    if (option.meta?.type === "oportunidad") {
      updateField("oportunidad", option.value);
      return;
    }

    const ruc = typeof option.meta?.ruc === "string" ? option.meta.ruc : "";
    const contacto = typeof option.meta?.contacto === "string" ? option.meta.contacto : "";

    setForm((current) => ({
      ...current,
      cliente: option.value,
      clienteRuc: ruc,
      contacto,
    }));
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
        const precio = typeof meta?.precio === "number" ? meta.precio : 0;
        const unidad = typeof meta?.unidad === "string" ? meta.unidad : "UND";
        const productoId = typeof meta?.productoId === "string" ? meta.productoId : null;
        const iconBg = typeof meta?.iconBg === "string" ? meta.iconBg : "bg-blue-50";
        const iconColor = typeof meta?.iconColor === "string" ? meta.iconColor : "text-blue-600";
        const iconKind = typeof meta?.iconKind === "string" ? meta.iconKind : "product";

        const existingIndex = next.findIndex(
          (line) => line.productoCodigo === codigo && line.producto === option.value,
        );

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            cantidad: next[existingIndex].cantidad + 1,
          };
        } else {
          next.push({
            id: createCartLineId(),
            producto: option.value,
            productoCodigo: codigo,
            productoId,
            cantidad: 1,
            unidad,
            precioUnitario: precio,
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

  const handleVendedorChange = (value: string) => {
    const vendedor = ventaVendedores.find((item) => item.name === value);
    updateField("vendedor", value);
    if (vendedor) updateField("vendedorInitials", vendedor.initials);
  };

  const resetModal = () => {
    setForm(defaultNuevaVentaForm);
    setCartLines([]);
    setContextSearch("");
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

      if (form.tipoComprobante === "Proforma") {
        const { generateProformaPdf } = await import("@/lib/pdf/generate-proforma-pdf");
        await generateProformaPdf(payload, emisor);
        toast.success("Proforma PDF generada.");
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
    toast.success("Proforma PDF generada.");
  };

  const handleGuiaRemision = async () => {
    const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
    await generateGuiaRemisionPdf(buildFormPayload(), emisor);
    toast.success("Guía de remisión PDF generada.");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="flex max-h-[95vh] max-w-[1120px] flex-col gap-0 overflow-hidden border-slate-200 p-0 sm:rounded-xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">Nueva venta</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-slate-500">
                  Punto de venta — cliente a la izquierda, productos a la derecha.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* POS body */}
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(300px,360px)_1fr]">
          {/* Left — Cliente y comprobante */}
          <aside className="overflow-y-auto border-b border-slate-100 bg-slate-50/60 p-5 lg:border-b-0 lg:border-r">
            <div className="space-y-6">
              <PanelSection title="Comprobante y pago" icon={FileText}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required>Tipo de comprobante</FieldLabel>
                    <SelectField
                      value={form.tipoComprobante}
                      onChange={handleTipoComprobanteChange}
                      options={ventaTiposComprobante}
                    />
                  </div>
                  <div>
                    <FieldLabel required>Serie</FieldLabel>
                    <SelectField
                      value={form.serie}
                      onChange={(value) => updateField("serie", value)}
                      options={serieOptions}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required>Fecha de emisión</FieldLabel>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.fechaEmision}
                        onChange={(event) => updateField("fechaEmision", event.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>Forma de pago</FieldLabel>
                    <SelectField
                      value={form.formaPago}
                      onChange={(value) => updateField("formaPago", value)}
                      options={ventaFormasPago}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Vendedor responsable</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <select
                        value={form.vendedor}
                        onChange={(event) => handleVendedorChange(event.target.value)}
                        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-10 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      >
                        {ventaVendedores.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <Avatar className="pointer-events-none absolute left-2 top-1/2 h-6 w-6 -translate-y-1/2">
                        <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                          {form.vendedorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                      aria-label="Agregar vendedor"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel required>Estado inicial</FieldLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
                      <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                        {form.estadoInicial}
                      </span>
                    </div>
                    <select
                      value={form.estadoInicial}
                      onChange={(event) => updateField("estadoInicial", event.target.value)}
                      className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-transparent focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    >
                      {ventaEstadosIniciales.map((estado) => (
                        <option key={estado} value={estado} className="text-slate-700">
                          {estado}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </PanelSection>

              <PanelSection title="Datos del cliente" icon={User}>
                <div>
                  <FieldLabel required>Cliente / contacto / oportunidad</FieldLabel>
                  <SearchableAutocomplete
                    placeholder={contextPlaceholder}
                    value={contextSearch}
                    options={clienteContextOptions}
                    onChange={setContextSearch}
                    onSelect={handleContextSelect}
                    onAdd={() => toast.info("Agregar nuevo cliente")}
                  />
                </div>

                {hasClienteResumen && (
                  <ClienteContextSummary
                    cliente={form.cliente}
                    clienteRuc={form.clienteRuc}
                    contacto={form.contacto}
                    oportunidad={form.oportunidad}
                    onClear={clearClienteContext}
                  />
                )}
              </PanelSection>
            </div>
          </aside>

          {/* Right — Carrito POS */}
          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {cartLines.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
                  <Package className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Carrito vacío</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Selecciona productos abajo y agrégalos al carrito.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="w-12 px-3 py-2.5" />
                        <th className="px-3 py-2.5">Producto</th>
                        <th className="w-24 px-3 py-2.5">Cant.</th>
                        <th className="w-28 px-3 py-2.5">P. unit.</th>
                        <th className="w-28 px-3 py-2.5 text-right">Subtotal</th>
                        <th className="w-10 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {cartLines.map((line) => {
                        const lineSubtotal = line.cantidad * line.precioUnitario;
                        return (
                          <tr key={line.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2.5">
                              <ProductLineThumb
                                iconKind={line.iconKind}
                                iconBg={line.iconBg}
                                iconColor={line.iconColor}
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-slate-800">{line.producto}</p>
                              {line.productoCodigo && (
                                <p className="text-xs text-slate-400">{line.productoCodigo}</p>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
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
                                className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                              />
                            </td>
                            <td className="px-3 py-2.5">
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
                                className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-700">
                              {formatVentaCurrency(lineSubtotal)}
                            </td>
                            <td className="px-2 py-2.5">
                              <button
                                type="button"
                                onClick={() => removeCartLine(line.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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

            <div className="shrink-0 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="text-xs text-slate-500">
                  {cartLines.length} {cartLines.length === 1 ? "ítem" : "ítems"} en el carrito
                </p>
                <div className="flex items-end gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Subtotal</p>
                    <p className="text-sm font-medium text-slate-700">{formatVentaCurrency(totals.subtotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">IGV (18%)</p>
                    <p className="text-sm font-medium text-slate-700">{formatVentaCurrency(totals.igv)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-2xl font-bold text-blue-600">{formatVentaCurrency(totals.total)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-5">
              <PanelSection title="Producto o servicio" icon={Package}>
                <FieldLabel required>Buscar y seleccionar uno o más</FieldLabel>
                <ProductMultiPicker
                  options={productoOptions}
                  onAddSelected={addProductsToCart}
                  onAdd={() => toast.info("Agregar nuevo producto")}
                />
              </PanelSection>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBorrador}
            disabled={isSubmitting}
            className="h-9 border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleProforma}
            disabled={isSubmitting}
            className="h-9 border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Generar proforma
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGuiaRemision}
            disabled={isSubmitting}
            className="h-9 border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Guía de remisión PDF
          </Button>
          <Button
            type="button"
            onClick={handleRegistrar}
            disabled={isSubmitting}
            className="h-9 gap-2 bg-blue-600 px-4 font-semibold hover:bg-blue-500"
          >
            <FileText className="h-4 w-4" />
            {isSubmitting ? "Registrando..." : "Registrar venta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
