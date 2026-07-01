import { useMemo, useState, type ReactNode } from "react";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  CreditCard,
  Plus,
  Search,
  Send,
  ShoppingCart,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ordenAlmacenes,
  ordenCentrosCosto,
  ordenCondicionesPago,
  ordenEstadosAprobacion,
  ordenPrioridades,
  ordenProductos,
  ordenProveedores,
  ordenRequisiciones,
  ordenResponsables,
  ordenUnidades,
} from "@/lib/nueva-orden-compra-mock-data";
import {
  calculateOrdenCompraTotals,
  defaultNuevaOrdenCompraForm,
  defaultOrdenCompraItem,
  formatOrdenCurrency,
  type NuevaOrdenCompraFormData,
  type OrdenCompraItem,
} from "@/lib/nueva-orden-compra-types";
import { generateOrdenCompraPdf } from "@/lib/pdf/generate-orden-compra-pdf";
import { cn } from "@/lib/utils";

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function SearchableField({
  placeholder,
  listId,
  value,
  onChange,
}: {
  placeholder: string;
  listId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      />
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  renderValue,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon?: typeof User;
  renderValue?: (value: string) => ReactNode;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon ? "pl-9" : "pl-3",
          renderValue && value ? "text-transparent" : "",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option} className="text-slate-700">
            {option}
          </option>
        ))}
      </select>
      {renderValue && value && (
        <div className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2">
          {renderValue(value)}
        </div>
      )}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "yellow" | "orange" }) {
  const styles =
    tone === "yellow"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-orange-200 bg-orange-50 text-orange-700";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function NuevaOrdenCompraModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<NuevaOrdenCompraFormData>(defaultNuevaOrdenCompraForm);

  const activeItem = form.items[0] ?? defaultOrdenCompraItem;
  const totals = useMemo(() => calculateOrdenCompraTotals(form.items), [form.items]);

  const updateField = <K extends keyof NuevaOrdenCompraFormData>(
    key: K,
    value: NuevaOrdenCompraFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateActiveItem = (patch: Partial<OrdenCompraItem>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, index) => (index === 0 ? { ...item, ...patch } : item)),
    }));
  };

  const handleProveedorChange = (value: string) => {
    const proveedor = ordenProveedores.find((item) => item.label === value);
    updateField("proveedor", value);
    if (proveedor) updateField("ruc", proveedor.ruc);
  };

  const handleProductoChange = (value: string) => {
    const producto = ordenProductos.find((item) => item.label === value);
    updateActiveItem({ producto: value });
    if (producto) {
      updateActiveItem({
        productoCodigo: producto.codigo,
        precioUnitario: producto.precio,
      });
    }
  };

  const handleResponsableChange = (value: string) => {
    const responsable = ordenResponsables.find((item) => item.name === value);
    updateField("responsable", value);
    if (responsable) updateField("responsableInitials", responsable.initials);
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevaOrdenCompraForm);
  };

  const handleCreatePdf = (mode: "create" | "approval" | "draft") => {
    if (mode !== "draft") {
      const number = generateOrdenCompraPdf(form);
      toast.success(
        mode === "approval"
          ? `Orden ${number} enviada a aprobación y PDF generado.`
          : `Orden ${number} creada y PDF generado.`,
      );
      if (mode === "create") handleClose();
      return;
    }
    toast.success("Borrador guardado correctamente.");
  };

  const handleAddItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { ...defaultOrdenCompraItem }],
    }));
    toast.info(`Item ${form.items.length + 1} agregado`);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[95vh] max-w-[920px] gap-0 overflow-y-auto border-slate-200 p-0 sm:rounded-2xl [&>button:last-child]:hidden">
        <datalist id="list-proveedores">
          {ordenProveedores.map((item) => (
            <option key={item.label} value={item.label} />
          ))}
        </datalist>
        <datalist id="list-productos-oc">
          {ordenProductos.map((item) => (
            <option key={item.label} value={item.label} />
          ))}
        </datalist>
        <datalist id="list-requisiciones">
          {ordenRequisiciones.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                <ShoppingCart className="h-5 w-5 text-orange-600" strokeWidth={2} />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Nueva Orden de Compra</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Registra una compra, solicita aprobación y programa recepción en almacén.
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

        <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <FieldLabel required>Proveedor</FieldLabel>
              <SearchableField
                listId="list-proveedores"
                placeholder="Buscar proveedor..."
                value={form.proveedor}
                onChange={handleProveedorChange}
              />
            </div>
            <div>
              <FieldLabel required>RUC</FieldLabel>
              <input
                type="text"
                placeholder="RUC del proveedor"
                value={form.ruc}
                onChange={(event) => updateField("ruc", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel required>Producto / servicio</FieldLabel>
              <SearchableField
                listId="list-productos-oc"
                placeholder="Buscar producto o servicio..."
                value={activeItem.producto}
                onChange={handleProductoChange}
              />
            </div>
            <div>
              <FieldLabel required>Cantidad</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ingresa la cantidad"
                  value={activeItem.cantidad || ""}
                  onChange={(event) =>
                    updateActiveItem({ cantidad: Number(event.target.value) || 0 })
                  }
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <div className="relative w-[88px] shrink-0">
                  <select
                    value={activeItem.unidad}
                    onChange={(event) => updateActiveItem({ unidad: event.target.value })}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 pr-6 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    {ordenUnidades.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel required>Centro de costo</FieldLabel>
              <SelectField
                icon={Briefcase}
                placeholder="Seleccionar centro de costo..."
                value={form.centroCosto}
                onChange={(value) => updateField("centroCosto", value)}
                options={ordenCentrosCosto}
              />
            </div>
            <div>
              <FieldLabel>Requerimiento vinculado</FieldLabel>
              <SearchableField
                listId="list-requisiciones"
                placeholder="Buscar requisición (opcional)..."
                value={form.requerimiento}
                onChange={(value) => updateField("requerimiento", value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel required>Almacén destino</FieldLabel>
              <SelectField
                icon={Warehouse}
                placeholder="Seleccionar almacén..."
                value={form.almacenDestino}
                onChange={(value) => updateField("almacenDestino", value)}
                options={ordenAlmacenes}
              />
            </div>
            <div>
              <FieldLabel required>Fecha requerida</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Seleccionar fecha"
                  value={form.fechaRequerida}
                  onChange={(event) => updateField("fechaRequerida", event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <FieldLabel required>Condición de pago</FieldLabel>
              <SelectField
                icon={CreditCard}
                placeholder="Seleccionar condición..."
                value={form.condicionPago}
                onChange={(value) => updateField("condicionPago", value)}
                options={ordenCondicionesPago}
              />
            </div>
            <div>
              <FieldLabel required>Responsable de compra</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={form.responsable}
                  onChange={(event) => handleResponsableChange(event.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-9 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">Seleccionar responsable...</option>
                  {ordenResponsables.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {form.responsable && (
                  <Avatar className="pointer-events-none absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2">
                    <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                      {form.responsableInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <FieldLabel required>Estado de aprobación</FieldLabel>
              <SelectField
                placeholder="Seleccionar estado..."
                value={form.estadoAprobacion}
                onChange={(value) => updateField("estadoAprobacion", value)}
                options={ordenEstadosAprobacion}
                renderValue={(value) => (
                  <StatusBadge
                    label={value}
                    tone={value.includes("Pendiente") ? "yellow" : "orange"}
                  />
                )}
              />
            </div>
            <div>
              <FieldLabel required>Prioridad</FieldLabel>
              <SelectField
                placeholder="Seleccionar prioridad..."
                value={form.prioridad}
                onChange={(value) => updateField("prioridad", value)}
                options={ordenPrioridades}
                renderValue={(value) => (
                  <StatusBadge label={value} tone={value === "Media" ? "orange" : "yellow"} />
                )}
              />
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 px-4 py-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-slate-500">Subtotal</p>
            <p className="text-sm font-semibold text-slate-800">{formatOrdenCurrency(totals.subtotal)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">IGV (18%)</p>
            <p className="text-sm font-semibold text-slate-800">{formatOrdenCurrency(totals.igv)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Total estimado</p>
            <p className="text-sm font-bold text-slate-900">{formatOrdenCurrency(totals.total)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Estado</p>
            <div className="mt-0.5">
              <StatusBadge label={form.estadoAprobacion} tone="yellow" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar item
          </button>
          <button
            type="button"
            onClick={() => toast.info("Buscando proveedores...")}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            <Search className="h-3.5 w-3.5" />
            Buscar proveedor
          </button>
          <button
            type="button"
            onClick={() => handleCreatePdf("approval")}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar a aprobación
          </button>
          {form.items.length > 1 && (
            <span className="text-xs text-slate-500">{form.items.length} ítems en la orden</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button type="button" variant="ghost" onClick={handleClose} className="text-slate-600">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCreatePdf("draft")}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            onClick={() => handleCreatePdf("create")}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Crear orden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
