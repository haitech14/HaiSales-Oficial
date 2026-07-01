import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  Boxes,
  FileText,
  Minus,
  Package,
  Plus,
  Receipt,
  Save,
  ShoppingBag,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultNuevoProductoForm,
  formToCreateInput,
  productoAfectacionIgv,
  productoAlmacenes,
  productoCategorias,
  productoEstados,
  productoTipos,
  productoUnidades,
  type CreateProductoInput,
  type NuevoProductoFormState,
} from "@/lib/inventario/producto-form-data";
import type { DbProductType } from "@/lib/inventario/types";
import { cn } from "@/lib/utils";

const infoFeatures = [
  {
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Código automático",
    subtitle: "SKU autogenerado",
  },
  {
    icon: Package,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    title: "Stock mínimo",
    subtitle: "Controla tu inventario",
  },
  {
    icon: Receipt,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Listo para facturar",
    subtitle: "Integrado con ventas",
  },
];

const tipoIcons = {
  package: Package,
  wrench: Wrench,
  boxes: Boxes,
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
        className,
      )}
    />
  );
}

function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  decimals = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  decimals?: number;
}) {
  const numeric = Number.parseFloat(value) || 0;

  const format = (num: number) =>
    decimals > 0 ? num.toFixed(decimals) : String(Math.max(min, Math.round(num)));

  const adjust = (delta: number) => {
    onChange(format(numeric + delta));
  };

  return (
    <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-600/20">
      <button
        type="button"
        onClick={() => adjust(-step)}
        className="flex w-10 shrink-0 items-center justify-center border-r border-slate-200 text-slate-500 hover:bg-slate-50"
        aria-label="Disminuir"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 px-3 text-center text-sm text-slate-800 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => adjust(step)}
        className="flex w-10 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-50"
        aria-label="Aumentar"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SelectField({
  placeholder,
  value,
  onValueChange,
  options,
}: {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 border-slate-200 text-sm text-slate-800 focus:ring-blue-600/20">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NuevoProductoModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateProductoInput, mode: "draft" | "create") => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [form, setForm] = useState<NuevoProductoFormState>(defaultNuevoProductoForm);

  const updateField = <K extends keyof NuevoProductoFormState>(
    key: K,
    value: NuevoProductoFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevoProductoForm);
  };

  const handleSubmit = async (mode: "draft" | "create") => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    if (!form.categoria) {
      toast.error("Selecciona una categoría");
      return;
    }
    if (!form.unidad) {
      toast.error("Selecciona una unidad de medida");
      return;
    }
    if (form.tipo !== "service" && !form.almacen) {
      toast.error("Selecciona un almacén inicial");
      return;
    }

    try {
      await onSubmit(formToCreateInput(form, mode), mode);
      toast.success(mode === "create" ? "Producto creado correctamente" : "Borrador guardado");
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el producto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[860px] gap-0 overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nuevo producto</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Crea un producto, servicio o kit listo para vender, facturar y controlar en inventario.
              </DialogDescription>
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

        <form
          className="px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit("create");
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {infoFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-3"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      feature.iconBg,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", feature.iconColor)} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{feature.title}</p>
                    <p className="text-[11px] text-slate-500">{feature.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <FieldLabel required>Tipo</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {productoTipos.map((tipo) => {
                    const Icon = tipoIcons[tipo.icon as keyof typeof tipoIcons];
                    const selected = form.tipo === tipo.value;
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => updateField("tipo", tipo.value as DbProductType)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                          selected
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                        {tipo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>SKU</FieldLabel>
                <TextInput
                  placeholder="Ej. PROD-000001"
                  value={form.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Nombre del producto</FieldLabel>
                <TextInput
                  placeholder="Ej. Laptop Dell Latitude 5440"
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Categoría</FieldLabel>
                <SelectField
                  placeholder="Selecciona una categoría"
                  value={form.categoria}
                  onValueChange={(value) => updateField("categoria", value)}
                  options={productoCategorias}
                />
              </div>

              <div>
                <FieldLabel required>Unidad de medida</FieldLabel>
                <SelectField
                  placeholder="Selecciona una unidad"
                  value={form.unidad}
                  onValueChange={(value) => updateField("unidad", value)}
                  options={productoUnidades}
                />
              </div>

              <div>
                <FieldLabel>Marca / modelo</FieldLabel>
                <TextInput
                  placeholder="Ej. Dell / Latitude 5440"
                  value={form.marcaModelo}
                  onChange={(event) => updateField("marcaModelo", event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-4 md:mt-0">
              <div>
                <FieldLabel required={form.tipo !== "service"}>Almacén inicial</FieldLabel>
                <SelectField
                  placeholder="Selecciona un almacén"
                  value={form.almacen}
                  onValueChange={(value) => updateField("almacen", value)}
                  options={productoAlmacenes}
                />
              </div>

              <div>
                <FieldLabel>Stock inicial</FieldLabel>
                <NumberStepper
                  value={form.stockInicial}
                  onChange={(value) => updateField("stockInicial", value)}
                  min={0}
                />
              </div>

              <div>
                <FieldLabel>Costo unitario (S/)</FieldLabel>
                <NumberStepper
                  value={form.costoUnitario}
                  onChange={(value) => updateField("costoUnitario", value)}
                  step={0.5}
                  min={0}
                  decimals={2}
                />
              </div>

              <div>
                <FieldLabel>Precio de venta (S/)</FieldLabel>
                <NumberStepper
                  value={form.precioVenta}
                  onChange={(value) => updateField("precioVenta", value)}
                  step={1}
                  min={0}
                  decimals={2}
                />
              </div>

              <div>
                <FieldLabel>Afectación IGV</FieldLabel>
                <SelectField
                  placeholder="Afecto"
                  value={form.afectacionIgv}
                  onValueChange={(value) => updateField("afectacionIgv", value)}
                  options={productoAfectacionIgv}
                />
              </div>

              <div>
                <FieldLabel>Estado</FieldLabel>
                <SelectField
                  placeholder="Activo"
                  value={form.estado}
                  onValueChange={(value) => updateField("estado", value)}
                  options={productoEstados}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => void handleSubmit("draft")}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4" />
                Guardar borrador
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-blue-600 hover:bg-blue-500"
                disabled={isSubmitting}
              >
                <ShoppingBag className="h-4 w-4" />
                Crear producto
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
