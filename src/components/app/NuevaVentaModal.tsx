import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  FileText,
  Plus,
  Search,
  ShoppingCart,
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
import {
  ventaClientes,
  ventaContactos,
  ventaEstadosIniciales,
  ventaFormasPago,
  ventaOportunidades,
  ventaProductos,
  ventaSeries,
  ventaTiposComprobante,
  ventaVendedores,
} from "@/lib/nueva-venta-mock-data";
import {
  calculateVentaTotals,
  defaultNuevaVentaForm,
  formatVentaCurrency,
  type NuevaVentaFormData,
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

function SearchableField({
  placeholder,
  listId,
  value,
  onChange,
  onAdd,
}: {
  placeholder: string;
  listId: string;
  value: string;
  onChange: (value: string) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          list={listId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
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

export function NuevaVentaModal({
  open,
  onOpenChange,
  onRegister,
  isSubmitting = false,
}: NuevaVentaModalProps) {
  const [form, setForm] = useState<NuevaVentaFormData>(defaultNuevaVentaForm);
  const { data: empresaConfig } = useEmpresaConfig();
  const emisor = useMemo(
    () => configToEmisor(empresaConfig ?? defaultEmpresaConfig),
    [empresaConfig],
  );

  const totals = useMemo(
    () => calculateVentaTotals(form.cantidad, form.precioUnitario),
    [form.cantidad, form.precioUnitario],
  );

  const updateField = <K extends keyof NuevaVentaFormData>(key: K, value: NuevaVentaFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClienteChange = (value: string) => {
    const cliente = ventaClientes.find((item) => item.label === value);
    updateField("cliente", value);
    if (cliente) updateField("clienteRuc", cliente.ruc);
  };

  const handleProductoChange = (value: string) => {
    const producto = ventaProductos.find((item) => item.label === value);
    updateField("producto", value);
    if (producto) {
      updateField("productoCodigo", producto.codigo);
      updateField("precioUnitario", producto.precio);
    }
  };

  const handleVendedorChange = (value: string) => {
    const vendedor = ventaVendedores.find((item) => item.name === value);
    updateField("vendedor", value);
    if (vendedor) updateField("vendedorInitials", vendedor.initials);
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevaVentaForm);
  };

  const handleRegistrar = async () => {
    try {
      if (onRegister) {
        await onRegister(form);
      }
      const { generateComprobantePdf } = await import("@/lib/pdf/generate-comprobante-pdf");
      await generateComprobantePdf(form, emisor);
      toast.success("Venta registrada y comprobante PDF generado.");
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
    await generateProformaPdf(form, emisor);
    toast.success("Proforma PDF generada.");
  };

  const handleGuiaRemision = async () => {
    const { generateGuiaRemisionPdf } = await import("@/lib/pdf/generate-guia-remision-pdf");
    await generateGuiaRemisionPdf(form, emisor);
    toast.success("Guía de remisión PDF generada.");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[95vh] max-w-[920px] gap-0 overflow-y-auto border-slate-200 p-0 sm:rounded-xl [&>button:last-child]:hidden">
        <datalist id="list-clientes">
          {ventaClientes.map((item) => (
            <option key={item.label} value={item.label} />
          ))}
        </datalist>
        <datalist id="list-contactos">
          {ventaContactos.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="list-oportunidades">
          {ventaOportunidades.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="list-productos">
          {ventaProductos.map((item) => (
            <option key={item.label} value={item.label} />
          ))}
        </datalist>

        {/* Header */}
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">Nueva venta</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-slate-500">
                  Registra una venta rápida y genera el comprobante en segundos.
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

        {/* Form body */}
        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <FieldLabel required>Cliente / Empresa</FieldLabel>
              <SearchableField
                listId="list-clientes"
                placeholder="Buscar cliente o empresa..."
                value={form.cliente}
                onChange={handleClienteChange}
                onAdd={() => toast.info("Agregar nuevo cliente")}
              />
            </div>
            <div>
              <FieldLabel>Contacto</FieldLabel>
              <SearchableField
                listId="list-contactos"
                placeholder="Buscar contacto..."
                value={form.contacto}
                onChange={(value) => updateField("contacto", value)}
                onAdd={() => toast.info("Agregar nuevo contacto")}
              />
            </div>
            <div>
              <FieldLabel>Oportunidad vinculada</FieldLabel>
              <SearchableField
                listId="list-oportunidades"
                placeholder="Buscar oportunidad..."
                value={form.oportunidad}
                onChange={(value) => updateField("oportunidad", value)}
                onAdd={() => toast.info("Agregar nueva oportunidad")}
              />
            </div>
            <div>
              <FieldLabel required>Producto o servicio</FieldLabel>
              <SearchableField
                listId="list-productos"
                placeholder="Buscar producto o servicio..."
                value={form.producto}
                onChange={handleProductoChange}
                onAdd={() => toast.info("Agregar nuevo producto")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Cantidad</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cantidad}
                    onChange={(event) => updateField("cantidad", Number(event.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <div className="relative w-20 shrink-0">
                    <select
                      value={form.unidad}
                      onChange={(event) => updateField("unidad", event.target.value)}
                      className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 pr-6 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    >
                      <option value="UND">UND</option>
                      <option value="KG">KG</option>
                      <option value="MTR">MTR</option>
                      <option value="HR">HR</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel required>Precio unitario</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioUnitario}
                    onChange={(event) => updateField("precioUnitario", Number(event.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <FieldLabel required>Tipo de comprobante</FieldLabel>
              <SelectField
                value={form.tipoComprobante}
                onChange={(value) => updateField("tipoComprobante", value)}
                options={ventaTiposComprobante}
              />
            </div>
            <div>
              <FieldLabel required>Serie</FieldLabel>
              <SelectField
                value={form.serie}
                onChange={(value) => updateField("serie", value)}
                options={ventaSeries}
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
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
          </div>
        </div>

        {/* Info + totals */}
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl bg-blue-50/80 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  Facturación electrónica lista
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  La venta se registrará con comprobante electrónico y será enviada al cliente.
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Sunat: Operativo
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-end gap-6 lg:gap-8">
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
                <p className="text-xl font-bold text-blue-600">{formatVentaCurrency(totals.total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBorrador}
            className="h-9 border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleProforma}
            className="h-9 border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Generar proforma
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGuiaRemision}
            className="h-9 border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Guía de remisión PDF
          </Button>
          <Button
            type="button"
            onClick={handleRegistrar}
            className="h-9 gap-2 bg-blue-600 px-4 font-semibold hover:bg-blue-500"
          >
            <FileText className="h-4 w-4" />
            Registrar venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
