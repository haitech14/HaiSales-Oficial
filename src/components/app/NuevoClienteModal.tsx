import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  CircleDot,
  FileCheck,
  IdCard,
  LayoutGrid,
  Mail,
  MapPin,
  Search,
  Tag,
  Target,
  User,
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
  clienteDistritos,
  clienteEjecutivos,
  clienteEstadosIniciales,
  clienteSegmentos,
  clienteTipos,
  defaultNuevoClienteForm,
  type NuevoClienteFormState,
} from "@/lib/clientes-form-data";
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
  rightSlot,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: typeof User;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          rightSlot && "pr-10",
          className,
        )}
      />
      {rightSlot}
    </div>
  );
}

function SelectField({
  icon: Icon,
  placeholder,
  value,
  onValueChange,
  options,
  renderValue,
}: {
  icon: typeof User;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  renderValue?: (label: string, color?: string) => ReactNode;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 border-slate-200 pl-9 text-sm text-slate-800 focus:ring-blue-600/20">
          <SelectValue placeholder={placeholder}>
            {selected && renderValue
              ? renderValue(selected.label, selected.color)
              : selected?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {renderValue ? renderValue(option.label, option.color) : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const infoFeatures = [
  {
    icon: User,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Consulta RUC automática",
    subtitle: "Verifica datos en SUNAT",
  },
  {
    icon: Target,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Sin duplicados",
    subtitle: "Validación en tiempo real",
  },
  {
    icon: FileCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Listo para cotizar",
    subtitle: "Ficha completa en segundos",
  },
];

export function NuevoClienteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<NuevoClienteFormState>(defaultNuevoClienteForm);

  const updateField = <K extends keyof NuevoClienteFormState>(key: K, value: NuevoClienteFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevoClienteForm);
  };

  const handleSubmit = (mode: "draft" | "create") => {
    if (mode === "create") {
      toast.success("Cliente creado correctamente");
    } else {
      toast.success("Borrador guardado");
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[860px] gap-0 overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nuevo cliente</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Registra una empresa y deja lista su ficha comercial, fiscal y de contacto.
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
              <FieldLabel required>Tipo de cliente</FieldLabel>
              <div className="relative">
                <SelectField
                  icon={LayoutGrid}
                  placeholder="Selecciona un tipo"
                  value={form.tipoCliente}
                  onValueChange={(value) => updateField("tipoCliente", value)}
                  options={clienteTipos}
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Correo electrónico</FieldLabel>
              <InputWithIcon
                icon={Mail}
                type="email"
                placeholder="Ej. contacto@empresa.com"
                value={form.correo}
                onChange={(event) => updateField("correo", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>RUC / DNI</FieldLabel>
              <InputWithIcon
                icon={IdCard}
                placeholder="Ej. 20123456789"
                value={form.rucDni}
                onChange={(event) => updateField("rucDni", event.target.value)}
                rightSlot={
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    aria-label="Consultar RUC"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                }
              />
            </div>

            <div>
              <FieldLabel required>Dirección fiscal</FieldLabel>
              <InputWithIcon
                icon={MapPin}
                placeholder="Ej. Av. Los Próceres 123, San Isidro"
                value={form.direccionFiscal}
                onChange={(event) => updateField("direccionFiscal", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Razón social</FieldLabel>
              <InputWithIcon
                icon={Building2}
                placeholder="Ej. CORPORACIÓN ABC S.A.C."
                value={form.razonSocial}
                onChange={(event) => updateField("razonSocial", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Distrito / ciudad</FieldLabel>
              <div className="relative">
                <SelectField
                  icon={Building2}
                  placeholder="Selecciona o escribe"
                  value={form.distrito}
                  onValueChange={(value) => updateField("distrito", value)}
                  options={clienteDistritos}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Nombre comercial</FieldLabel>
              <InputWithIcon
                icon={Building2}
                placeholder="Ej. Corporación ABC"
                value={form.nombreComercial}
                onChange={(event) => updateField("nombreComercial", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Segmento</FieldLabel>
              <div className="relative">
                <SelectField
                  icon={Tag}
                  placeholder="Selecciona un segmento"
                  value={form.segmento}
                  onValueChange={(value) => updateField("segmento", value)}
                  options={clienteSegmentos}
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Contacto principal</FieldLabel>
              <InputWithIcon
                icon={User}
                placeholder="Ej. Juan Pérez"
                value={form.contactoPrincipal}
                onChange={(event) => updateField("contactoPrincipal", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>Ejecutivo asignado</FieldLabel>
              <div className="relative">
                <SelectField
                  icon={User}
                  placeholder="Selecciona un ejecutivo"
                  value={form.ejecutivo}
                  onValueChange={(value) => updateField("ejecutivo", value)}
                  options={clienteEjecutivos}
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Teléfono / WhatsApp</FieldLabel>
              <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-600/20">
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-3 text-xs font-medium text-slate-700"
                >
                  <span className="text-base leading-none">🇵🇪</span>
                  +51
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
                <input
                  type="tel"
                  placeholder="Ej. 987 654 321"
                  value={form.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  className="min-w-0 flex-1 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  className="flex w-10 shrink-0 items-center justify-center border-l border-slate-200 text-emerald-600 hover:bg-emerald-50"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <FieldLabel required>Estado inicial</FieldLabel>
              <div className="relative">
                <SelectField
                  icon={CircleDot}
                  placeholder="Selecciona un estado"
                  value={form.estadoInicial}
                  onValueChange={(value) => updateField("estadoInicial", value)}
                  options={clienteEstadosIniciales}
                  renderValue={(label, color) => (
                    <span className={cn("flex items-center gap-2 font-medium", color ?? "text-emerald-600")}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {label}
                    </span>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 px-4 py-4 sm:grid-cols-3">
            {infoFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-3">
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
                    <p className="text-xs text-slate-500">{feature.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" className="text-slate-600 hover:text-slate-800" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => handleSubmit("draft")}
            >
              Guardar borrador
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
              Crear cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
