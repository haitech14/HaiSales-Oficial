import { useCallback, useMemo, useRef, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  History,
  Plus,
  Search,
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
import { clienteTipoOptions, type ClientRecord } from "@/lib/clientes-mock-data";
import type { NuevoClienteFormState } from "@/lib/clientes-form-data";
import { searchClientesForPicker, resolveClienteIdForVenta, updateClienteFromVentaForm } from "@/lib/clientes/clientes-service";
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
  fetchVentaForRecovery,
  searchVentasForRecovery,
  type VentaRecoveryListItem,
} from "@/lib/ventas/ventas-service";
import {
  calculateCartTotals,
  defaultNuevaVentaForm,
  formatVentaCurrency,
  resolveUnitPriceForClienteTipo,
  unitPriceForMoneda,
  type NuevaVentaFormData,
  type VentaCartLine,
  type VentaMoneda,
  type VentaPriceTiers,
} from "@/lib/nueva-venta-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { configToEmisor, defaultEmpresaConfig } from "@/lib/parametros/empresa-service";
import {
  DEFAULT_COMPROBANTE_GIRO,
  DEFAULT_CUENTAS_BANCARIAS,
  DEFAULT_HAITECH_EMISOR,
} from "@/lib/pdf/comprobante-emisor";
import type { ComprobantePdfEmisor } from "@/lib/pdf/comprobante-emisor";
import { VentaRegistradaSuccessDialog } from "@/components/app/VentaRegistradaSuccessDialog";
import { useQueryClient } from "@tanstack/react-query";

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
    <label className="mb-1 block text-[11px] font-medium text-slate-600">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function SectionHeading({
  step,
  title,
  className,
}: {
  step: number;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
        {step}
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

function ClienteContextSummary({
  cliente,
  clienteRuc,
  contacto,
  celular,
  direccion,
  tipoCliente,
  onContactoChange,
  onCelularChange,
  onDireccionChange,
  onTipoClienteChange,
  onPersistCliente,
  onClear,
}: {
  cliente: string;
  clienteRuc: string;
  contacto: string;
  celular: string;
  direccion: string;
  tipoCliente: string;
  onContactoChange: (value: string) => void;
  onCelularChange: (value: string) => void;
  onDireccionChange: (value: string) => void;
  onTipoClienteChange: (value: string) => void;
  onPersistCliente: () => void;
  onClear: () => void;
}) {
  const tipoOptions =
    tipoCliente && !clienteTipoOptions.includes(tipoCliente)
      ? [tipoCliente, ...clienteTipoOptions]
      : clienteTipoOptions;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900" title={cliente}>
              {cliente || "—"}
            </p>
            {clienteRuc ? (
              <p className="mt-0.5 text-xs text-slate-500">RUC {clienteRuc}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="h-8 shrink-0 self-start border-blue-200 bg-white text-xs font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          Cambiar cliente
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Contacto
          </p>
          <input
            type="text"
            value={contacto}
            onChange={(event) => onContactoChange(event.target.value)}
            onBlur={() => onPersistCliente()}
            placeholder="Nombre del contacto"
            className={fieldControlClass}
          />
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Celular
          </p>
          <input
            type="tel"
            value={celular}
            onChange={(event) => onCelularChange(event.target.value)}
            onBlur={() => onPersistCliente()}
            placeholder="Ej. 987 654 321"
            className={fieldControlClass}
          />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Dirección
          </p>
          <input
            type="text"
            value={direccion}
            onChange={(event) => onDireccionChange(event.target.value)}
            onBlur={() => onPersistCliente()}
            placeholder="Dirección fiscal o de entrega"
            className={fieldControlClass}
          />
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Tipo de cliente
          </p>
          <SelectField
            value={tipoCliente || "Público"}
            onChange={onTipoClienteChange}
            options={tipoOptions}
          />
        </div>
      </div>
    </div>
  );
}

const fieldControlClass =
  "h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/10";

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
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
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
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [recuperarQuery, setRecuperarQuery] = useState("");
  const [recuperarResults, setRecuperarResults] = useState<VentaRecoveryListItem[]>([]);
  const [recuperarLoading, setRecuperarLoading] = useState(false);
  const [recuperandoId, setRecuperandoId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successForm, setSuccessForm] = useState<NuevaVentaFormData | null>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const persistInFlightRef = useRef<Promise<void> | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { createCliente, isCreating: isCreatingCliente } = useClientes();
  const { data: empresaConfig } = useEmpresaConfig();
  const emisor = useMemo((): ComprobantePdfEmisor => {
    const config = empresaConfig ?? defaultEmpresaConfig;
    const base = configToEmisor(config);
    const hasEmpresa = Boolean(config.ruc?.trim() || config.razonSocial?.trim());
    if (!hasEmpresa) return { ...DEFAULT_HAITECH_EMISOR };

    return {
      ...DEFAULT_HAITECH_EMISOR,
      ...base,
      nombreComercial: config.nombreComercial?.trim() || DEFAULT_HAITECH_EMISOR.nombreComercial,
      logoUrl: config.logoUrl || undefined,
      giro: DEFAULT_COMPROBANTE_GIRO,
      web: DEFAULT_HAITECH_EMISOR.web,
      cuentasBancarias: DEFAULT_CUENTAS_BANCARIAS,
      resolucionSunat: DEFAULT_HAITECH_EMISOR.resolucionSunat,
      proveedorFacturacion: DEFAULT_HAITECH_EMISOR.proveedorFacturacion,
      telefono:
        base.telefono && base.telefono !== "—"
          ? `Ventas: ${base.telefono.replace(/^\+51\s*/, "")} / Soporte: 965805873 / Ventas 2: 926224243`
          : DEFAULT_HAITECH_EMISOR.telefono,
    };
  }, [empresaConfig]);
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
          celular: client.telefono,
          direccion: client.direccion,
          tipoCliente: client.tipoCliente,
        },
      }));
    },
    [user?.id],
  );

  const contextPlaceholder = "Buscar por cliente, contacto, celular, correo o producto...";

  const updateField = <K extends keyof NuevaVentaFormData>(key: K, value: NuevaVentaFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const persistClienteFields = useCallback(
    async (
      override?: Partial<
        Pick<
          NuevaVentaFormData,
          "clienteId" | "cliente" | "clienteRuc" | "contacto" | "celular" | "direccion" | "tipoCliente"
        >
      >,
    ) => {
      if (!user?.id) return;
      const snapshot = { ...formRef.current, ...override };
      if (!snapshot.cliente.trim() && !snapshot.clienteRuc.trim() && !snapshot.clienteId.trim()) {
        return;
      }

      const run = async () => {
        const clienteId = await resolveClienteIdForVenta(user.id, {
          clienteId: snapshot.clienteId,
          ruc: snapshot.clienteRuc,
          razonSocial: snapshot.cliente,
        });
        if (!clienteId) return;

        if (clienteId !== snapshot.clienteId) {
          setForm((current) => ({ ...current, clienteId }));
          formRef.current = { ...formRef.current, clienteId };
        }

        await updateClienteFromVentaForm(user.id, clienteId, {
          contacto: snapshot.contacto,
          celular: snapshot.celular,
          direccion: snapshot.direccion,
          tipoCliente: snapshot.tipoCliente || "Público",
        });
        void queryClient.invalidateQueries({ queryKey: ["clientes", "snapshot"] });
      };

      const pending = run().catch((error) => {
        console.warn("[nueva-venta] No se pudo guardar ficha del cliente:", error);
        toast.error(
          error instanceof Error ? error.message : "No se pudieron guardar los datos del cliente",
        );
      });
      persistInFlightRef.current = pending.then(() => undefined);
      await pending;
    },
    [queryClient, user?.id],
  );

  const handleTipoComprobanteChange = (value: string) => {
    setForm((current) => ({
      ...current,
      tipoComprobante: value,
      serie: resolveSerieForTipoForm(value, seriesConfig),
    }));
  };

  const handleContextSelect = (option: AutocompleteOption) => {
    const ruc = typeof option.meta?.ruc === "string" ? option.meta.ruc : "";
    const contacto = typeof option.meta?.contacto === "string" ? option.meta.contacto : "";
    const celular = typeof option.meta?.celular === "string" ? option.meta.celular : "";
    const direccion = typeof option.meta?.direccion === "string" ? option.meta.direccion : "";
    const tipoCliente =
      typeof option.meta?.tipoCliente === "string" ? option.meta.tipoCliente : "";
    const clienteId = typeof option.meta?.id === "string" ? option.meta.id : "";
    if (clienteId) {
      rememberRecentClienteId(user?.id, clienteId);
    }

    setContextSearch("");
    setForm((current) => ({
      ...current,
      clienteId,
      cliente: option.label || option.value,
      clienteRuc: ruc,
      contacto,
      celular,
      direccion,
      tipoCliente: tipoCliente || "Público",
    }));
    const nextTipo = tipoCliente || "Público";
    setCartLines((current) =>
      current.map((line) =>
        line.precioManual
          ? line
          : {
              ...line,
              precioUnitario: resolveUnitPriceForClienteTipo(form.moneda, nextTipo, {
                precioPen: line.precioPen,
                precioUsd: line.precioUsd,
                preciosPen: line.preciosPen,
                preciosUsd: line.preciosUsd,
                fallback: line.precioPen ?? 0,
              }),
            },
      ),
    );
  };

  const applyClienteToForm = (client: ClientRecord) => {
    setContextSearch("");
    rememberRecentClienteId(user?.id, client.id);
    setForm((current) => ({
      ...current,
      clienteId: client.id,
      cliente: client.razonSocial,
      clienteRuc: client.ruc !== "—" ? client.ruc : "",
      contacto: client.contacto && client.contacto !== "—" ? client.contacto : "",
      celular: client.telefono && client.telefono !== "—" ? client.telefono : "",
      direccion: client.direccion && client.direccion !== "—" ? client.direccion : "",
      tipoCliente: client.tipoCliente || "Público",
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
      clienteId: "",
      cliente: "",
      clienteRuc: "",
      contacto: "",
      celular: "",
      direccion: "",
      tipoCliente: "",
      oportunidad: "",
    }));
  };

  const metaNumber = (meta: AutocompleteOption["meta"], key: string): number => {
    const raw = meta?.[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const buildPriceTiersFromMeta = (
    meta: AutocompleteOption["meta"],
  ): { preciosPen: VentaPriceTiers; preciosUsd: VentaPriceTiers } => {
    const precioPen = metaNumber(meta, "precioPen") || metaNumber(meta, "precio");
    const precioUsd = metaNumber(meta, "precioUsd");
    return {
      preciosPen: {
        publico: metaNumber(meta, "precioPublicoPen") || precioPen || null,
        mayorista: metaNumber(meta, "precioMayoristaPen") || null,
        tecnico: metaNumber(meta, "precioTecnicoPen") || null,
        distribuidor: metaNumber(meta, "precioDistribuidorPen") || null,
      },
      preciosUsd: {
        publico: metaNumber(meta, "precioPublicoUsd") || precioUsd || null,
        mayorista: metaNumber(meta, "precioMayoristaUsd") || null,
        tecnico: metaNumber(meta, "precioTecnicoUsd") || null,
        distribuidor: metaNumber(meta, "precioDistribuidorUsd") || null,
      },
    };
  };

  const priceForLine = (
    line: Pick<VentaCartLine, "precioPen" | "precioUsd" | "preciosPen" | "preciosUsd">,
    moneda: VentaMoneda,
    tipoCliente: string,
  ) =>
    resolveUnitPriceForClienteTipo(moneda, tipoCliente, {
      precioPen: line.precioPen,
      precioUsd: line.precioUsd,
      preciosPen: line.preciosPen,
      preciosUsd: line.preciosUsd,
      fallback: line.precioPen ?? line.precioUsd ?? 0,
    });

  const addProductsToCart = (selectedOptions: AutocompleteOption[]) => {
    if (selectedOptions.length === 0) return;
    const tipoCliente = form.tipoCliente || "Público";

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
        const { preciosPen, preciosUsd } = buildPriceTiersFromMeta(meta);
        const precio = resolveUnitPriceForClienteTipo(form.moneda, tipoCliente, {
          precioPen,
          precioUsd,
          preciosPen,
          preciosUsd,
          fallback: precioPen,
        });
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
            preciosPen,
            preciosUsd,
            precioManual: false,
            observaciones: "",
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
    const tipoCliente = form.tipoCliente || "Público";
    setCartLines((current) =>
      current.map((line) => {
        if (line.precioManual) {
          return {
            ...line,
            precioUnitario: unitPriceForMoneda(
              moneda,
              line.precioPen,
              line.precioUsd,
              line.precioUnitario,
            ),
          };
        }
        return {
          ...line,
          precioUnitario: priceForLine(line, moneda, tipoCliente),
        };
      }),
    );
  };

  const handleTipoClienteChange = (value: string) => {
    updateField("tipoCliente", value);
    setCartLines((current) =>
      current.map((line) =>
        line.precioManual
          ? line
          : {
              ...line,
              precioUnitario: priceForLine(line, form.moneda, value),
            },
      ),
    );
    void persistClienteFields({ tipoCliente: value });
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
    setRecuperarOpen(false);
    setRecuperarQuery("");
    setRecuperarResults([]);
    setRecuperandoId(null);
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
      if (persistInFlightRef.current) {
        await persistInFlightRef.current;
      }

      const payload = buildFormPayload();
      const isInterno = isDocumentoInternoForm(form.tipoComprobante);

      if (user?.id) {
        const clienteId = await resolveClienteIdForVenta(user.id, {
          clienteId: payload.clienteId,
          ruc: payload.clienteRuc,
          razonSocial: payload.cliente,
        });

        if (clienteId) {
          await updateClienteFromVentaForm(user.id, clienteId, {
            contacto: payload.contacto,
            celular: payload.celular,
            direccion: payload.direccion,
            tipoCliente: payload.tipoCliente || "Público",
          });
          payload.clienteId = clienteId;
          void queryClient.invalidateQueries({ queryKey: ["clientes", "snapshot"] });
        } else {
          toast.warning("Venta sin ficha de cliente vinculada: no se actualizó Contacto/Celular/Tipo");
        }
      }

      if (!isInterno && onRegister) {
        await onRegister(payload);
      }

      setSuccessForm(payload);
      handleClose();
      setSuccessOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la venta");
    }
  };

  const handleBorrador = () => {
    void persistClienteFields().then(() => {
      toast.success("Datos del cliente guardados.");
    });
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

  const loadRecuperarVentas = useCallback(
    async (query: string) => {
      if (!user?.id) {
        setRecuperarResults([]);
        return;
      }
      setRecuperarLoading(true);
      try {
        const rows = await searchVentasForRecovery(user.id, query, 15);
        setRecuperarResults(rows);
      } finally {
        setRecuperarLoading(false);
      }
    },
    [user?.id],
  );

  const handleRecuperarOpenChange = (next: boolean) => {
    setRecuperarOpen(next);
    if (next) {
      setRecuperarQuery("");
      void loadRecuperarVentas("");
    }
  };

  const handleRecuperarVenta = async (ventaId: string) => {
    if (!user?.id) {
      toast.error("Inicia sesión para recuperar comprobantes");
      return;
    }

    setRecuperandoId(ventaId);
    try {
      const detail = await fetchVentaForRecovery(user.id, ventaId);
      if (!detail) {
        toast.error("No se pudo cargar el comprobante");
        return;
      }

      // Completar ficha del cliente si existe por RUC
      let clienteId = "";
      let contacto = "";
      let celular = "";
      let direccion = "";
      let tipoCliente = detail.tipoCliente || "Público";
      if (detail.clienteRuc) {
        const matches = await searchClientesForPicker(user.id, detail.clienteRuc, [], 3);
        const exact =
          matches.find((row) => row.ruc === detail.clienteRuc) ?? matches[0] ?? null;
        if (exact) {
          clienteId = exact.id;
          contacto = exact.contacto;
          celular = exact.telefono;
          direccion = exact.direccion;
          tipoCliente = exact.tipoCliente || tipoCliente;
          rememberRecentClienteId(user.id, exact.id);
        }
      }

      const tipoForm = detail.tipoComprobanteForm;
      const serie =
        detail.serie || resolveSerieForTipoForm(tipoForm, seriesConfig);

      setForm((current) => ({
        ...current,
        clienteId,
        cliente: detail.clienteNombre,
        clienteRuc: detail.clienteRuc,
        contacto,
        celular,
        direccion,
        tipoCliente,
        tipoComprobante: tipoForm,
        serie,
        moneda: detail.moneda,
        fechaEmision: detail.fechaEmision,
        vendedor: detail.vendedor || current.vendedor,
        vendedorInitials: detail.vendedorInitials || current.vendedorInitials,
        formaPago: detail.formaPago || current.formaPago,
        observacionGeneral: detail.observacionGeneral,
      }));

      setCartLines(
        detail.items.map((item) => ({
          id: createCartLineId(),
          producto: item.producto,
          productoCodigo: item.productoCodigo,
          productoId: item.productoId,
          cantidad: item.cantidad,
          unidad: item.unidad,
          precioUnitario: item.precioUnitario,
          precioPen: detail.moneda === "PEN" ? item.precioUnitario : undefined,
          precioUsd: detail.moneda === "USD" ? item.precioUnitario : undefined,
          precioManual: true,
          observaciones: item.observaciones,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
          iconKind: "product",
        })),
      );

      setContextSearch("");
      setRecuperarOpen(false);
      toast.success(`Comprobante ${detail.venta.codigo} recuperado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recuperar el comprobante");
    } finally {
      setRecuperandoId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent
        className="flex max-h-[95vh] max-w-[1100px] flex-col gap-0 overflow-hidden border-slate-200/80 p-0 shadow-xl sm:rounded-2xl [&>button:last-child]:hidden"
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
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Nueva venta
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-slate-500">
                  Completa el comprobante, el cliente y los productos.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* 1. Comprobante y cliente */}
          <section className="relative z-50 border-b border-slate-100 px-6 py-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <SectionHeading step={1} title="Comprobante y cliente" />
              <Popover open={recuperarOpen} onOpenChange={handleRecuperarOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 gap-1.5 border-blue-200 bg-white text-xs font-medium text-blue-700 hover:bg-blue-50"
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
                        onChange={(event) => {
                          const value = event.target.value;
                          setRecuperarQuery(value);
                          void loadRecuperarVentas(value);
                        }}
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
                          onClick={() => void handleRecuperarVenta(venta.id)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-blue-50 disabled:opacity-60"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {venta.codigo}
                            </span>
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

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
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
              </div>

              <div className="flex shrink-0 flex-wrap items-end gap-2.5">
                <div className="min-w-[170px] flex-1 sm:w-[200px] sm:flex-none">
                  <FieldLabel required>Tipo de comprobante</FieldLabel>
                  <SelectField
                    value={form.tipoComprobante}
                    onChange={handleTipoComprobanteChange}
                    options={ventaTiposComprobante}
                  />
                </div>
                <div className="w-[88px] shrink-0">
                  <FieldLabel required>Serie</FieldLabel>
                  <SelectField
                    value={form.serie}
                    onChange={(value) => updateField("serie", value)}
                    options={serieOptions}
                  />
                </div>
                <div className="w-[120px] shrink-0">
                  <FieldLabel required>Moneda</FieldLabel>
                  <SelectField
                    value={form.moneda}
                    onChange={handleMonedaChange}
                    options={[...ventaMonedas]}
                  />
                </div>
                <div className="w-[128px] shrink-0">
                  <FieldLabel required>Fecha de emisión</FieldLabel>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.fechaEmision}
                      onChange={(event) => updateField("fechaEmision", event.target.value)}
                      className={cn(fieldControlClass, "pr-8")}
                    />
                    <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {hasClienteResumen && (
              <div className="mt-3.5">
                <ClienteContextSummary
                  cliente={form.cliente}
                  clienteRuc={form.clienteRuc}
                  contacto={form.contacto}
                  celular={form.celular}
                  direccion={form.direccion}
                  tipoCliente={form.tipoCliente}
                  onContactoChange={(value) => updateField("contacto", value)}
                  onCelularChange={(value) => updateField("celular", value)}
                  onDireccionChange={(value) => updateField("direccion", value)}
                  onTipoClienteChange={handleTipoClienteChange}
                  onPersistCliente={() => {
                    void persistClienteFields();
                  }}
                  onClear={clearClienteContext}
                />
              </div>
            )}
          </section>

          {/* 2. Producto o servicio */}
          <section className="relative z-30 border-b border-slate-100 px-6 py-5">
            <SectionHeading step={2} title="Producto o servicio" className="mb-3" />

            <div className="relative z-20">
              <ProductMultiPicker
                placeholder="Buscar en haitech.pe o soporte..."
                loadOptions={searchHaitechCatalog}
                onAddSelected={addProductsToCart}
                onAdd={() => toast.info("Agregar nuevo producto")}
                addButtonLabel="Agregar producto"
                hideFooterAddButton
                debounceMs={150}
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {cartLines.length === 0 ? (
                <div className="flex min-h-[120px] flex-col items-center justify-center bg-slate-50/60 px-6 py-8 text-center">
                  <ShoppingCart className="mb-2 h-7 w-7 text-slate-300" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-slate-500">Carrito vacío</p>
                  <p className="mt-0.5 text-xs text-slate-400">Agrega productos desde el buscador</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium text-slate-500">
                      <th className="px-4 py-2.5 font-medium">Producto</th>
                      <th className="w-[88px] px-3 py-2.5 font-medium">Cant.</th>
                      <th className="w-[110px] px-3 py-2.5 font-medium">P. unit.</th>
                      <th className="w-[110px] px-3 py-2.5 text-right font-medium">Subtotal</th>
                      <th className="w-[88px] px-3 py-2.5 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartLines.map((line) => {
                      const lineSubtotal = line.cantidad * line.precioUnitario;
                      return (
                        <tr key={line.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-start gap-3">
                              <ProductLineThumb
                                iconKind={line.iconKind}
                                iconBg={line.iconBg}
                                iconColor={line.iconColor}
                                imageUrl={line.imageUrl}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800">{line.producto}</p>
                                {line.productoCodigo ? (
                                  <p className="text-xs text-slate-400">{line.productoCodigo}</p>
                                ) : null}
                                <input
                                  type="text"
                                  value={line.observaciones ?? ""}
                                  onChange={(event) =>
                                    updateCartLine(line.id, {
                                      observaciones: event.target.value,
                                    })
                                  }
                                  placeholder="Observaciones del producto..."
                                  className="mt-2 h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                />
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
                                updateCartLine(line.id, {
                                  cantidad: Number(event.target.value) || 0,
                                })
                              }
                              onBlur={() => {
                                if (line.cantidad < 0.01) {
                                  updateCartLine(line.id, { cantidad: 1 });
                                }
                              }}
                              className={fieldControlClass}
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
                                updateCartLine(line.id, {
                                  precioUnitario: Number(event.target.value) || 0,
                                  precioManual: true,
                                })
                              }
                              className={fieldControlClass}
                              title="Editar precio (manual). Cambia el tipo de cliente para recalcular tarifas."
                            />
                          </td>
                          <td className="px-3 py-3 align-top text-right tabular-nums font-medium text-slate-700">
                            {formatVentaCurrency(lineSubtotal, form.moneda)}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeCartLine(line.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label="Quitar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <div className="flex flex-wrap items-center justify-end gap-4 border-t border-blue-100 bg-blue-50/60 px-4 py-3">
                <span className="text-xs text-slate-400">Precios con IGV</span>
                <span className="text-sm text-slate-500">
                  Subtotal:{" "}
                  <span className="font-medium tabular-nums text-slate-700">
                    {formatVentaCurrency(totals.subtotal, form.moneda)}
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  IGV (18%):{" "}
                  <span className="font-medium tabular-nums text-slate-700">
                    {formatVentaCurrency(totals.igv, form.moneda)}
                  </span>
                </span>
                <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold tabular-nums text-white shadow-sm shadow-blue-600/20">
                  Total: {formatVentaCurrency(totals.total, form.moneda)}
                </span>
              </div>
            </div>
          </section>

          {/* 3. Condiciones de la venta */}
          <section className="px-6 py-5">
            <SectionHeading step={3} title="Condiciones de la venta" className="mb-3" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className={cn(fieldControlClass, "pl-9 pr-7")}
                    >
                      {vendedoresOptions.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <Avatar className="pointer-events-none absolute left-1.5 top-1/2 h-5 w-5 -translate-y-1/2">
                      <AvatarFallback className="bg-blue-50 text-[8px] font-semibold text-blue-700">
                        {form.vendedorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Popover open={vendedorPopoverOpen} onOpenChange={setVendedorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
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

            <div className="mt-3">
              <FieldLabel>Observación general</FieldLabel>
              <textarea
                value={form.observacionGeneral}
                onChange={(event) => updateField("observacionGeneral", event.target.value)}
                placeholder="Notas para la venta, entrega, facturación, etc."
                rows={3}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBorrador}
            disabled={isSubmitting}
            className="h-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleProforma}
            disabled={isSubmitting}
            className="h-9 border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
          >
            Cotización
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGuiaRemision}
            disabled={isSubmitting}
            className="h-9 border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
          >
            Guía de remisión
          </Button>
          <Button
            type="button"
            onClick={handleRegistrar}
            disabled={isSubmitting}
            className="h-9 gap-1.5 bg-blue-600 px-4 font-medium text-white hover:bg-blue-700"
          >
            <FileText className="h-3.5 w-3.5" />
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

      <VentaRegistradaSuccessDialog
        open={successOpen}
        onOpenChange={(next) => {
          setSuccessOpen(next);
          if (!next) setSuccessForm(null);
        }}
        form={successForm}
        emisor={emisor}
      />
    </>
  );
}
