import { useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Barcode,
  Calendar,
  Check,
  Layers,
  Paperclip,
  Save,
  Search,
  User,
  Warehouse,
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
  calculateMovimientoSummary,
  defaultNuevoMovimientoForm,
  formatMovimientoCurrency,
  movimientoAlmacenes,
  movimientoMotivos,
  movimientoResponsables,
  movimientoTipos,
  movimientoUbicaciones,
  type NuevoMovimientoFormState,
} from "@/lib/almacenes-form-data";
import { cn } from "@/lib/utils";

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: typeof User;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon ? "pl-9 pr-3" : "px-3",
          className,
        )}
      />
    </div>
  );
}

function SelectField({
  icon: Icon,
  placeholder,
  value,
  onValueChange,
  options,
}: {
  icon: typeof User;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 border-slate-200 pl-9 text-sm text-slate-800 focus:ring-blue-600/20">
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
    </div>
  );
}

const summaryFields = [
  { label: "Stock actual", key: "stockActual" as const, color: "text-blue-600" },
  { label: "Stock resultante", key: "stockResultante" as const, color: "text-emerald-600" },
  { label: "Costo promedio", key: "costoPromedio" as const, color: "text-slate-900", isCurrency: true },
];

export function NuevoMovimientoAlmacenModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<NuevoMovimientoFormState>(defaultNuevoMovimientoForm);

  const updateField = <K extends keyof NuevoMovimientoFormState>(
    key: K,
    value: NuevoMovimientoFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const summary = useMemo(
    () => calculateMovimientoSummary(form.cantidad, form.costoUnitario),
    [form.cantidad, form.costoUnitario],
  );

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevoMovimientoForm);
  };

  const handleSubmit = (mode: "draft" | "create") => {
    if (mode === "create" && !form.productoSku.trim()) {
      toast.error("Busca o ingresa un producto / SKU");
      return;
    }
    if (mode === "create" && !form.cantidad.trim()) {
      toast.error("Ingresa la cantidad del movimiento");
      return;
    }

    toast.success(mode === "create" ? "Movimiento registrado correctamente" : "Borrador guardado");
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setForm(defaultNuevoMovimientoForm);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-[860px] gap-0 overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Nuevo movimiento de almacén
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Registra entradas, salidas o transferencias y actualiza el kardex en tiempo real.
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
            handleSubmit("create");
          }}
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Tipo de movimiento</FieldLabel>
              <SelectField
                icon={ArrowLeftRight}
                placeholder="Selecciona el tipo"
                value={form.tipoMovimiento}
                onValueChange={(value) => updateField("tipoMovimiento", value)}
                options={movimientoTipos}
              />
            </div>

            <div>
              <FieldLabel required>Almacén destino</FieldLabel>
              <SelectField
                icon={Warehouse}
                placeholder="Selecciona el almacén"
                value={form.almacenDestino}
                onValueChange={(value) => updateField("almacenDestino", value)}
                options={movimientoAlmacenes}
              />
            </div>

            <div>
              <FieldLabel required>Producto / SKU</FieldLabel>
              <InputWithIcon
                icon={Search}
                placeholder="Buscar producto o ingresar SKU..."
                value={form.productoSku}
                onChange={(event) => updateField("productoSku", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Ubicación destino</FieldLabel>
              <SelectField
                icon={Warehouse}
                placeholder="Selecciona la ubicación"
                value={form.ubicacionDestino}
                onValueChange={(value) => updateField("ubicacionDestino", value)}
                options={movimientoUbicaciones}
              />
            </div>

            <div>
              <FieldLabel required>Almacén origen</FieldLabel>
              <SelectField
                icon={Warehouse}
                placeholder="Selecciona el almacén"
                value={form.almacenOrigen}
                onValueChange={(value) => updateField("almacenOrigen", value)}
                options={movimientoAlmacenes}
              />
            </div>

            <div>
              <FieldLabel required>Costo unitario</FieldLabel>
              <InputWithIcon
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.costoUnitario}
                onChange={(event) => updateField("costoUnitario", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Ubicación origen</FieldLabel>
              <SelectField
                icon={Warehouse}
                placeholder="Selecciona la ubicación"
                value={form.ubicacionOrigen}
                onValueChange={(value) => updateField("ubicacionOrigen", value)}
                options={movimientoUbicaciones}
              />
            </div>

            <div>
              <FieldLabel required>Motivo</FieldLabel>
              <SelectField
                icon={ArrowLeftRight}
                placeholder="Selecciona el motivo"
                value={form.motivo}
                onValueChange={(value) => updateField("motivo", value)}
                options={movimientoMotivos}
              />
            </div>

            <div>
              <FieldLabel required>Cantidad</FieldLabel>
              <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-600/20">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.cantidad}
                  onChange={(event) => updateField("cantidad", event.target.value)}
                  className="min-w-0 flex-1 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <span className="flex shrink-0 items-center border-l border-slate-200 px-3 text-xs font-medium text-slate-500">
                  Unidades
                </span>
              </div>
            </div>

            <div>
              <FieldLabel required>Responsable</FieldLabel>
              <SelectField
                icon={User}
                placeholder="Selecciona el responsable"
                value={form.responsable}
                onValueChange={(value) => updateField("responsable", value)}
                options={movimientoResponsables}
              />
            </div>

            <div>
              <FieldLabel>Documento referencia</FieldLabel>
              <InputWithIcon
                placeholder="Ej. FAC F001-000123, O/C 001-785, etc."
                value={form.documentoReferencia}
                onChange={(event) => updateField("documentoReferencia", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Fecha de movimiento</FieldLabel>
              <div className="relative">
                <input
                  type="date"
                  value={form.fechaMovimiento}
                  onChange={(event) => updateField("fechaMovimiento", event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 px-4 py-4 sm:grid-cols-4">
            {summaryFields.map((field) => (
              <div key={field.label}>
                <p className="text-[11px] font-medium text-slate-500">{field.label}</p>
                <p className={cn("mt-0.5 text-base font-bold", field.color)}>
                  {field.isCurrency
                    ? formatMovimientoCurrency(summary[field.key])
                    : `${summary[field.key].toFixed(2)} Unid.`}
                </p>
              </div>
            ))}
            <div>
              <p className="text-[11px] font-medium text-slate-500">Estado</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <Check className="h-4 w-4" />
                Kardex actualizado
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-600">
              <Barcode className="h-4 w-4" />
              Escanear código
            </Button>
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-600">
              <Layers className="h-4 w-4" />
              Agregar lote
            </Button>
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-600">
              <Paperclip className="h-4 w-4" />
              Adjuntar guía
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => handleSubmit("draft")}
            >
              Guardar borrador
            </Button>
            <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-500">
              <Save className="h-4 w-4" />
              Registrar movimiento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
