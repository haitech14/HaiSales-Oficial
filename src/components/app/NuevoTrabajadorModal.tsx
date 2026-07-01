import { useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  CreditCard,
  FileText,
  IdCard,
  Landmark,
  Loader2,
  Scale,
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
import type { CreateTrabajadorInput } from "@/lib/planillas-form-data";
import {
  calculateTrabajadorPayroll,
  defaultNuevoTrabajadorForm,
  formToCreateInput,
  formatTrabajadorCurrency,
  trabajadorAreas,
  trabajadorBancos,
  trabajadorCargos,
  trabajadorDiasLaborables,
  trabajadorEstadosIniciales,
  trabajadorRegimenes,
  trabajadorSupervisores,
  trabajadorTiposContrato,
  trabajadorTurnos,
  type NuevoTrabajadorFormState,
} from "@/lib/planillas-form-data";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  {
    icon: IdCard,
    title: "Validar DNI",
    subtitle: "Verifica identidad del trabajador",
  },
  {
    icon: Clock,
    title: "Asignar horario",
    subtitle: "Define el horario y turnos",
  },
  {
    icon: FileText,
    title: "Generar ficha laboral",
    subtitle: "Crea la ficha y documentos",
  },
] as const;

const summaryItems = [
  { label: "Costo mensual estimado", subtext: "Incluye sueldo y aportes", key: "costoMensual" as const },
  { label: "Aportes", subtext: "ESSALUD + AFP + otros", key: "aportes" as const },
  { label: "Neto referencial", subtext: "Monto aproximado", key: "netoReferencial" as const },
];

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
  leftSlot,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: typeof User;
  rightSlot?: ReactNode;
  leftSlot?: ReactNode;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      {leftSlot && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
          {leftSlot}
        </div>
      )}
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon && "pl-9",
          leftSlot && !Icon && "pl-10",
          !Icon && !leftSlot && "px-3",
          rightSlot ? "pr-[7.5rem]" : "pr-3",
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

function validateStep(step: number, form: NuevoTrabajadorFormState, dniValidado: boolean): string | null {
  if (step === 0) {
    if (!form.dni.trim()) return "Ingresa el número de DNI";
    if (!dniValidado) return "Debes validar el DNI antes de continuar";
    if (!form.nombresApellidos.trim()) return "Ingresa nombres y apellidos";
    if (!form.cargo) return "Selecciona el cargo";
    if (!form.area) return "Selecciona el área";
    if (!form.fechaIngreso.trim()) return "Ingresa la fecha de ingreso";
    if (!form.tipoContrato) return "Selecciona el tipo de contrato";
  }

  if (step === 1) {
    if (!form.turno) return "Selecciona el turno";
    if (!form.horaEntrada.trim()) return "Ingresa la hora de entrada";
    if (!form.horaSalida.trim()) return "Ingresa la hora de salida";
    if (!form.diasLaborables) return "Selecciona los días laborables";
  }

  if (step === 2) {
    if (!form.sueldoBasico.trim() || parseFloat(form.sueldoBasico) <= 0) {
      return "Ingresa un sueldo básico válido";
    }
    if (!form.regimenLaboral) return "Selecciona el régimen laboral";
    if (!form.banco) return "Selecciona el banco";
    if (!form.cuentaSueldo.trim()) return "Ingresa la cuenta sueldo";
    if (!form.supervisor) return "Selecciona el supervisor";
    if (!form.estadoInicial) return "Selecciona el estado inicial";
  }

  return null;
}

export function NuevoTrabajadorModal({
  open,
  onOpenChange,
  onSubmit,
  onValidateDni,
  isSubmitting,
  isValidatingDni,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTrabajadorInput, mode: "draft" | "create") => Promise<void>;
  onValidateDni: (dni: string) => Promise<{ ok: true; dni: string }>;
  isSubmitting?: boolean;
  isValidatingDni?: boolean;
}) {
  const [form, setForm] = useState<NuevoTrabajadorFormState>(defaultNuevoTrabajadorForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [dniValidado, setDniValidado] = useState(false);

  const updateField = <K extends keyof NuevoTrabajadorFormState>(
    key: K,
    value: NuevoTrabajadorFormState[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "dni" && value !== current.dni) {
        setDniValidado(false);
      }
      if (key === "turno") {
        if (value === "diurno") {
          next.horaEntrada = "08:00";
          next.horaSalida = "17:00";
        } else if (value === "tarde") {
          next.horaEntrada = "14:00";
          next.horaSalida = "22:00";
        } else if (value === "noche") {
          next.horaEntrada = "22:00";
          next.horaSalida = "06:00";
        }
      }
      return next;
    });
  };

  const payroll = useMemo(() => calculateTrabajadorPayroll(form.sueldoBasico), [form.sueldoBasico]);

  const resetModal = () => {
    setForm(defaultNuevoTrabajadorForm);
    setCurrentStep(0);
    setDniValidado(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetModal();
  };

  const handleSubmit = async (mode: "draft" | "create") => {
    if (mode === "create") {
      const error = validateStep(2, form, dniValidado);
      if (error) {
        toast.error(error);
        setCurrentStep(2);
        return;
      }
    } else if (!form.dni.trim()) {
      toast.error("Ingresa al menos el DNI para guardar un borrador");
      return;
    }

    try {
      await onSubmit(formToCreateInput(form, mode, dniValidado), mode);
      toast.success(mode === "create" ? "Trabajador creado correctamente" : "Borrador guardado");
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el trabajador");
    }
  };

  const handleValidateDni = async () => {
    if (!form.dni.trim()) {
      toast.error("Ingresa un número de DNI para validar");
      return;
    }

    try {
      await onValidateDni(form.dni.trim());
      setDniValidado(true);
      toast.success("DNI validado correctamente");
    } catch (error) {
      setDniValidado(false);
      toast.error(error instanceof Error ? error.message : "No se pudo validar el DNI");
    }
  };

  const goNext = () => {
    const error = validateStep(currentStep, form, dniValidado);
    if (error) {
      toast.error(error);
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetModal();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-[860px] gap-0 overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nuevo trabajador</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Registra al colaborador y deja lista su ficha laboral para planillas y asistencia.
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

          <div className="mt-4 flex items-stretch gap-2 rounded-xl bg-blue-50/60 p-2">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.title} className="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      "flex min-w-0 flex-1 items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition",
                      isActive && "border-blue-200 bg-white shadow-sm",
                      isCompleted && "border-blue-100 bg-white/80",
                      !isActive && !isCompleted && "border-transparent bg-transparent",
                      index < currentStep && "cursor-pointer hover:border-blue-200",
                      index > currentStep && "cursor-default opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        isActive || isCompleted ? "bg-blue-100" : "bg-slate-100",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
                      ) : (
                        <Icon
                          className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")}
                          strokeWidth={2}
                        />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-xs font-semibold",
                          isActive || isCompleted ? "text-blue-700" : "text-slate-600",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="truncate text-[10px] leading-tight text-slate-500">{step.subtitle}</p>
                    </div>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form
          className="px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit("create");
          }}
        >
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div>
                <FieldLabel required>DNI</FieldLabel>
                <InputWithIcon
                  icon={IdCard}
                  placeholder="Ingresa el número de DNI"
                  value={form.dni}
                  maxLength={8}
                  inputMode="numeric"
                  onChange={(event) => updateField("dni", event.target.value.replace(/\D/g, ""))}
                  rightSlot={
                    <button
                      type="button"
                      onClick={handleValidateDni}
                      disabled={isValidatingDni}
                      className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      {isValidatingDni && <Loader2 className="h-3 w-3 animate-spin" />}
                      {dniValidado ? "Validado" : "Validar DNI"}
                    </button>
                  }
                />
                {dniValidado && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3" />
                    DNI disponible en el sistema
                  </p>
                )}
              </div>

              <div>
                <FieldLabel required>Nombres y apellidos</FieldLabel>
                <InputWithIcon
                  icon={User}
                  placeholder="Ej. Juan Carlos Pérez García"
                  value={form.nombresApellidos}
                  onChange={(event) => updateField("nombresApellidos", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Cargo</FieldLabel>
                <SelectField
                  icon={Briefcase}
                  placeholder="Selecciona el cargo"
                  value={form.cargo}
                  onValueChange={(value) => updateField("cargo", value)}
                  options={trabajadorCargos}
                />
              </div>

              <div>
                <FieldLabel required>Área</FieldLabel>
                <SelectField
                  icon={Building2}
                  placeholder="Selecciona el área"
                  value={form.area}
                  onValueChange={(value) => updateField("area", value)}
                  options={trabajadorAreas}
                />
              </div>

              <div>
                <FieldLabel required>Fecha de ingreso</FieldLabel>
                <div className="relative">
                  <input
                    type="date"
                    value={form.fechaIngreso}
                    onChange={(event) => updateField("fechaIngreso", event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <FieldLabel required>Tipo de contrato</FieldLabel>
                <SelectField
                  icon={FileText}
                  placeholder="Selecciona el tipo de contrato"
                  value={form.tipoContrato}
                  onValueChange={(value) => updateField("tipoContrato", value)}
                  options={trabajadorTiposContrato}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div>
                <FieldLabel required>Turno</FieldLabel>
                <SelectField
                  icon={Clock}
                  placeholder="Selecciona el turno"
                  value={form.turno}
                  onValueChange={(value) => updateField("turno", value)}
                  options={trabajadorTurnos}
                />
              </div>

              <div>
                <FieldLabel required>Días laborables</FieldLabel>
                <SelectField
                  icon={CalendarDays}
                  placeholder="Selecciona los días"
                  value={form.diasLaborables}
                  onValueChange={(value) => updateField("diasLaborables", value)}
                  options={trabajadorDiasLaborables}
                />
              </div>

              <div>
                <FieldLabel required>Hora de entrada</FieldLabel>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={form.horaEntrada}
                    onChange={(event) => updateField("horaEntrada", event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>Hora de salida</FieldLabel>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={form.horaSalida}
                    onChange={(event) => updateField("horaSalida", event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-800">Resumen de horario</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {form.turno
                      ? `${trabajadorTurnos.find((t) => t.value === form.turno)?.label ?? form.turno} · ${form.horaEntrada || "--:--"} a ${form.horaSalida || "--:--"} · ${trabajadorDiasLaborables.find((d) => d.value === form.diasLaborables)?.label ?? "Sin días definidos"}`
                      : "Selecciona turno y días laborables para ver el resumen."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div>
                  <FieldLabel required>Sueldo básico</FieldLabel>
                  <InputWithIcon
                    leftSlot="S/"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.sueldoBasico}
                    onChange={(event) => updateField("sueldoBasico", event.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel required>Régimen laboral</FieldLabel>
                  <SelectField
                    icon={Scale}
                    placeholder="Selecciona el régimen laboral"
                    value={form.regimenLaboral}
                    onValueChange={(value) => updateField("regimenLaboral", value)}
                    options={trabajadorRegimenes}
                  />
                </div>

                <div>
                  <FieldLabel required>Banco</FieldLabel>
                  <SelectField
                    icon={Landmark}
                    placeholder="Selecciona el banco"
                    value={form.banco}
                    onValueChange={(value) => updateField("banco", value)}
                    options={trabajadorBancos}
                  />
                </div>

                <div>
                  <FieldLabel required>Cuenta sueldo</FieldLabel>
                  <InputWithIcon
                    icon={CreditCard}
                    placeholder="Nº de cuenta sueldo"
                    value={form.cuentaSueldo}
                    onChange={(event) => updateField("cuentaSueldo", event.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel required>Supervisor</FieldLabel>
                  <SelectField
                    icon={User}
                    placeholder="Selecciona el supervisor"
                    value={form.supervisor}
                    onValueChange={(value) => updateField("supervisor", value)}
                    options={trabajadorSupervisores}
                  />
                </div>

                <div>
                  <FieldLabel required>Estado inicial</FieldLabel>
                  <SelectField
                    icon={CircleDot}
                    placeholder="Selecciona el estado"
                    value={form.estadoInicial}
                    onValueChange={(value) => updateField("estadoInicial", value)}
                    options={trabajadorEstadosIniciales}
                    renderValue={(label, color) => (
                      <span className={cn("flex items-center gap-2 font-medium", color ?? "text-emerald-600")}>
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {label}
                      </span>
                    )}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-blue-50/70 px-4 py-4 sm:grid-cols-3">
                {summaryItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {formatTrabajadorCurrency(payroll[item.key])}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.subtext}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {currentStep > 0 && (
                <Button type="button" variant="ghost" className="text-slate-600" onClick={goBack}>
                  Anterior
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                disabled={isSubmitting}
                onClick={() => handleSubmit("draft")}
              >
                Guardar borrador
              </Button>

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button type="button" className="bg-blue-600 hover:bg-blue-500" onClick={goNext}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear trabajador
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
