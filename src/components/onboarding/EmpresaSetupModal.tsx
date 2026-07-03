import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyMultiSelect } from "@/components/parametros/CurrencyMultiSelect";
import { EmpresaLogoUpload } from "@/components/parametros/EmpresaLogoUpload";
import { PhonePrefixInput } from "@/components/parametros/PhonePrefixInput";
import { OnboardingTrabajadoresEditor } from "@/components/onboarding/OnboardingTrabajadoresEditor";
import { SedesEditor } from "@/components/parametros/SedesEditor";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaConfig, useInvalidateEmpresaConfig } from "@/hooks/useEmpresaConfig";
import {
  completeEmpresaOnboarding,
  defaultEmpresaConfig,
  hasEmpresaRegistrada,
  type OnboardingTrabajadorInput,
} from "@/lib/parametros/empresa-service";
import {
  clearEmpresaSetupDraft,
  empresaConfigToSetupForm,
  loadEmpresaSetupDraft,
  saveEmpresaSetupDraft,
  type EmpresaSetupFormState,
} from "@/lib/parametros/empresa-setup-draft";
import {
  isTrabajadorDraftEmpty,
  type OnboardingTrabajadorDraft,
} from "@/lib/parametros/onboarding-trabajador-data";
import { trabajadorAreas } from "@/lib/planillas-form-data";
import { prefetchAppRoutes } from "@/lib/prefetch-app-routes";
import {
  PAIS_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
  ZONA_HORARIA_OPTIONS,
} from "@/lib/parametros/empresa-config-data";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "fiscal", label: "Datos fiscales", icon: Building2 },
  { id: "impuestos", label: "Impuestos", icon: Receipt },
  { id: "trabajadores", label: "Trabajadores", icon: Users },
  { id: "contador", label: "Contador", icon: Calculator },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const inputClass =
  "h-11 w-full rounded-[10px] border-transparent bg-[#eef2f8] px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function resolveSelectLabel(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

type EmpresaSetupModalProps = {
  className?: string;
};

function createDefaultEmpresa(email = ""): EmpresaSetupFormState {
  return {
    razonSocial: "",
    nombreComercial: "",
    ruc: "",
    direccion: "",
    telefonoPrefijo: defaultEmpresaConfig.telefonoPrefijo,
    telefono: "",
    email,
    ciudad: "",
    pais: defaultEmpresaConfig.pais,
    tipoContribuyente: "",
    gerenteGeneral: "",
    impuestoRenta: defaultEmpresaConfig.impuestoRenta,
    logoUrl: "",
    zonaHoraria: defaultEmpresaConfig.zonaHoraria,
    monedas: defaultEmpresaConfig.monedas,
    igvPorcentaje: defaultEmpresaConfig.igvPorcentaje,
    regimenTributario: defaultEmpresaConfig.regimenTributario,
    serieFactura: defaultEmpresaConfig.serieFactura,
    serieBoleta: defaultEmpresaConfig.serieBoleta,
    serieNotaCredito: defaultEmpresaConfig.serieNotaCredito,
    serieNotaDebito: defaultEmpresaConfig.serieNotaDebito,
    serieGuiaRemision: defaultEmpresaConfig.serieGuiaRemision,
    serieProforma: defaultEmpresaConfig.serieProforma,
    serieOrdenCompra: defaultEmpresaConfig.serieOrdenCompra,
    serieOrdenPedido: defaultEmpresaConfig.serieOrdenPedido,
    serieOrdenServicio: defaultEmpresaConfig.serieOrdenServicio,
    sedes: [],
  };
}

export function EmpresaSetupModal({ className }: EmpresaSetupModalProps) {
  const { user } = useAuth();
  const { data: savedConfig, isLoading: isConfigLoading } = useEmpresaConfig();
  const invalidateEmpresaConfig = useInvalidateEmpresaConfig();
  const [isHydrated, setIsHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaSetupFormState>(() => createDefaultEmpresa());
  const [trabajadores, setTrabajadores] = useState<OnboardingTrabajadorDraft[]>([]);
  const [contador, setContador] = useState({
    nombre: "",
    email: "",
  });

  useEffect(() => {
    if (!user?.id || isConfigLoading || isHydrated) return;

    const draft = loadEmpresaSetupDraft(user.id);
    const fromDb =
      savedConfig && !savedConfig.setupCompleted && !hasEmpresaRegistrada(savedConfig)
        ? empresaConfigToSetupForm(savedConfig)
        : null;

    if (draft) {
      setEmpresa({
        ...createDefaultEmpresa(user.email ?? ""),
        ...draft.empresa,
        email: draft.empresa.email || user.email || "",
      });
      setTrabajadores(draft.trabajadores);
      setContador(draft.contador);
      setStepIndex(Math.min(Math.max(draft.stepIndex, 0), STEPS.length - 1));
    } else if (fromDb) {
      setEmpresa({
        ...createDefaultEmpresa(user.email ?? ""),
        ...fromDb,
        email: fromDb.email || user.email || "",
      });
      setContador({
        nombre: savedConfig?.contadorNombre ?? "",
        email: savedConfig?.contadorEmail ?? "",
      });
    } else {
      setEmpresa(createDefaultEmpresa(user.email ?? ""));
    }

    setIsHydrated(true);
  }, [user?.id, user?.email, savedConfig, isConfigLoading, isHydrated]);

  useEffect(() => {
    if (!user?.id || !isHydrated) return;

    const timer = window.setTimeout(() => {
      saveEmpresaSetupDraft(user.id, {
        stepIndex,
        empresa,
        trabajadores,
        contador,
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [user?.id, isHydrated, stepIndex, empresa, trabajadores, contador]);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const updateEmpresa = <K extends keyof typeof empresa>(key: K, value: (typeof empresa)[K]) => {
    setEmpresa((current) => ({ ...current, [key]: value }));
  };

  const validateStep = (stepId: StepId): boolean => {
    if (stepId === "fiscal") {
      if (!empresa.razonSocial.trim()) {
        toast.error("Ingresa la razón social de la empresa");
        return false;
      }
      if (!/^\d{11}$/.test(empresa.ruc.trim())) {
        toast.error("El RUC debe tener 11 dígitos numéricos");
        return false;
      }
      if (!empresa.direccion.trim()) {
        toast.error("Ingresa la dirección fiscal");
        return false;
      }
      if (!empresa.ciudad.trim()) {
        toast.error("Ingresa la ciudad");
        return false;
      }
      if (!empresa.pais.trim()) {
        toast.error("Selecciona el país");
        return false;
      }
      return true;
    }

    if (stepId === "impuestos") {
      if (!empresa.tipoContribuyente) {
        toast.error("Selecciona el tipo de contribuyente");
        return false;
      }
      if (!empresa.zonaHoraria) {
        toast.error("Selecciona la zona horaria");
        return false;
      }
      if (empresa.igvPorcentaje < 0 || empresa.igvPorcentaje > 100) {
        toast.error("El IGV debe estar entre 0 y 100");
        return false;
      }
      if (empresa.monedas.length === 0) {
        toast.error("Selecciona al menos una moneda");
        return false;
      }
      if (
        !empresa.serieFactura.trim() ||
        !empresa.serieBoleta.trim() ||
        !empresa.serieNotaCredito.trim() ||
        !empresa.serieNotaDebito.trim() ||
        !empresa.serieGuiaRemision.trim() ||
        !empresa.serieProforma.trim() ||
        !empresa.serieOrdenCompra.trim() ||
        !empresa.serieOrdenPedido.trim() ||
        !empresa.serieOrdenServicio.trim()
      ) {
        toast.error("Completa todas las series de comprobantes");
        return false;
      }
      return true;
    }

    if (stepId === "trabajadores") {
      const filled = trabajadores.filter((item) => !isTrabajadorDraftEmpty(item));
      if (filled.length === 0) return true;

      for (const [index, item] of filled.entries()) {
        if (!/^\d{8}$/.test(item.dni.trim())) {
          toast.error(`El DNI del trabajador ${index + 1} debe tener 8 dígitos`);
          return false;
        }
        if (!item.nombresApellidos.trim()) {
          toast.error(`Ingresa el nombre del trabajador ${index + 1}`);
          return false;
        }
        if (!item.area) {
          toast.error(`Selecciona el área del trabajador ${index + 1}`);
          return false;
        }
        if (!item.sueldoBasico || Number(item.sueldoBasico) <= 0) {
          toast.error(`Ingresa un sueldo básico válido para el trabajador ${index + 1}`);
          return false;
        }
        if (!item.horaEntrada || !item.horaSalida) {
          toast.error(`Indica horario de ingreso y salida del trabajador ${index + 1}`);
          return false;
        }
        if (item.enPlanilla) {
          if (!item.sistemaPensiones) {
            toast.error(`Selecciona AFP u ONP para el trabajador ${index + 1}`);
            return false;
          }
          if (!item.seguroSalud) {
            toast.error(`Selecciona ESSALUD o SIS para el trabajador ${index + 1}`);
            return false;
          }
        }
      }
      return true;
    }

    if (stepId === "contador") {
      if (contador.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contador.email)) {
        toast.error("Ingresa un correo válido para el contador");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep.id)) return;
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const buildTrabajadoresPayload = (): OnboardingTrabajadorInput[] => {
    return trabajadores
      .filter((item) => !isTrabajadorDraftEmpty(item))
      .map((item) => ({
        dni: item.dni.trim(),
        nombresApellidos: item.nombresApellidos.trim(),
        cargo: "Sin especificar",
        area: resolveSelectLabel(trabajadorAreas, item.area),
        sueldoBasico: Number(item.sueldoBasico),
        horaEntrada: item.horaEntrada,
        horaSalida: item.horaSalida,
        horaRefrigerio: item.horaRefrigerio || undefined,
        enPlanilla: item.enPlanilla,
        sistemaPensiones: item.enPlanilla && item.sistemaPensiones ? item.sistemaPensiones : undefined,
        seguroSalud: item.enPlanilla && item.seguroSalud ? item.seguroSalud : undefined,
      }));
  };

  const finishOnboarding = async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }

    for (const step of STEPS) {
      if (!validateStep(step.id)) {
        setStepIndex(STEPS.findIndex((item) => item.id === step.id));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await completeEmpresaOnboarding(user.id, {
        empresa,
        contadorNombre: contador.nombre,
        contadorEmail: contador.email,
        trabajadores: buildTrabajadoresPayload(),
      });
      clearEmpresaSetupDraft(user.id);
      invalidateEmpresaConfig();
      prefetchAppRoutes();
      toast.success("Empresa configurada correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la configuración");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isLastStep) {
      void finishOnboarding();
      return;
    }
    handleNext();
  };

  const skipToFinish = () => {
    if (currentStep.id === "trabajadores") {
      setTrabajadores([]);
    }
    if (currentStep.id === "contador") {
      void finishOnboarding();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  return (
    <div
      className={cn(
        "rounded-[20px] bg-white px-6 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:px-8 sm:py-9",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="empresa-setup-title"
    >
      <div className="text-center">
        <h1 id="empresa-setup-title" className="text-[1.65rem] font-bold text-slate-900 sm:text-[1.85rem]">
          Configura tu empresa
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Completa los datos fiscales, impuestos y equipo para empezar a operar en HaiSales.
        </p>
      </div>

      <ol className="mt-8 flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isDone = index < stepIndex;
          const isActive = index === stepIndex;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition",
                  isDone && "border-emerald-500 bg-emerald-500 text-white",
                  isActive && !isDone && "border-[#0b7cff] bg-[#0b7cff] text-white",
                  !isDone && !isActive && "border-slate-200 bg-slate-50 text-slate-400",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span
                className={cn(
                  "hidden text-center text-[11px] font-medium sm:block",
                  isActive ? "text-slate-900" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {currentStep.id === "fiscal" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Razón social" required>
                <input
                  className={inputClass}
                  value={empresa.razonSocial}
                  onChange={(e) => updateEmpresa("razonSocial", e.target.value)}
                  placeholder="Ej. Mi Empresa S.A.C."
                />
              </Field>
              <Field label="Nombre comercial">
                <input
                  className={inputClass}
                  value={empresa.nombreComercial}
                  onChange={(e) => updateEmpresa("nombreComercial", e.target.value)}
                  placeholder="Ej. Mi Marca"
                />
              </Field>
              <Field label="RUC" required>
                <input
                  className={inputClass}
                  value={empresa.ruc}
                  onChange={(e) => updateEmpresa("ruc", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="20123456789"
                  inputMode="numeric"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dirección fiscal" required>
                <input
                  className={inputClass}
                  value={empresa.direccion}
                  onChange={(e) => updateEmpresa("direccion", e.target.value)}
                  placeholder="Av. Principal 123, Lima"
                />
              </Field>
              <Field label="Ciudad" required>
                <input
                  className={inputClass}
                  value={empresa.ciudad}
                  onChange={(e) => updateEmpresa("ciudad", e.target.value)}
                  placeholder="Lima"
                />
              </Field>
              <Field label="Teléfono">
                <PhonePrefixInput
                  prefix={empresa.telefonoPrefijo}
                  phone={empresa.telefono}
                  onPrefixChange={(value) => updateEmpresa("telefonoPrefijo", value)}
                  onPhoneChange={(value) => updateEmpresa("telefono", value)}
                  inputClassName={inputClass}
                />
              </Field>
              <Field label="País" required>
                <select
                  className={inputClass}
                  value={empresa.pais}
                  onChange={(e) => updateEmpresa("pais", e.target.value)}
                >
                  {PAIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Correo de facturación">
                  <input
                    type="email"
                    className={inputClass}
                    value={empresa.email}
                    onChange={(e) => updateEmpresa("email", e.target.value)}
                    placeholder="facturacion@miempresa.pe"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Logo de la empresa">
                  <EmpresaLogoUpload
                    userId={user?.id}
                    value={empresa.logoUrl}
                    onChange={(logoUrl) => updateEmpresa("logoUrl", logoUrl)}
                    compact
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Sucursales">
                  <SedesEditor
                    sedes={empresa.sedes}
                    onChange={(sedes) => updateEmpresa("sedes", sedes)}
                    inputClassName={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {currentStep.id === "impuestos" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de contribuyente" required>
              <select
                className={inputClass}
                value={empresa.tipoContribuyente}
                onChange={(e) => updateEmpresa("tipoContribuyente", e.target.value)}
              >
                <option value="">Seleccionar tipo</option>
                {TIPO_CONTRIBUYENTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zona horaria" required>
              <select
                className={inputClass}
                value={empresa.zonaHoraria}
                onChange={(e) => updateEmpresa("zonaHoraria", e.target.value)}
              >
                {ZONA_HORARIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="IGV (%)" required>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className={inputClass}
                value={empresa.igvPorcentaje}
                onChange={(e) => updateEmpresa("igvPorcentaje", Number(e.target.value))}
              />
            </Field>
            <Field label="Moneda" required>
              <CurrencyMultiSelect
                value={empresa.monedas}
                onChange={(monedas) => updateEmpresa("monedas", monedas)}
              />
            </Field>
            <Field label="Serie factura" required>
              <input
                className={inputClass}
                value={empresa.serieFactura}
                onChange={(e) => updateEmpresa("serieFactura", e.target.value.toUpperCase())}
                placeholder="F001"
              />
            </Field>
            <Field label="Serie boleta" required>
              <input
                className={inputClass}
                value={empresa.serieBoleta}
                onChange={(e) => updateEmpresa("serieBoleta", e.target.value.toUpperCase())}
                placeholder="B001"
              />
            </Field>
            <Field label="Serie nota de crédito" required>
              <input
                className={inputClass}
                value={empresa.serieNotaCredito}
                onChange={(e) => updateEmpresa("serieNotaCredito", e.target.value.toUpperCase())}
                placeholder="FC01"
              />
            </Field>
            <Field label="Serie nota de débito" required>
              <input
                className={inputClass}
                value={empresa.serieNotaDebito}
                onChange={(e) => updateEmpresa("serieNotaDebito", e.target.value.toUpperCase())}
                placeholder="FD01"
              />
            </Field>
            <Field label="Serie guía de remisión" required>
              <input
                className={inputClass}
                value={empresa.serieGuiaRemision}
                onChange={(e) => updateEmpresa("serieGuiaRemision", e.target.value.toUpperCase())}
                placeholder="T001"
              />
            </Field>
            <Field label="Serie proforma" required>
              <input
                className={inputClass}
                value={empresa.serieProforma}
                onChange={(e) => updateEmpresa("serieProforma", e.target.value.toUpperCase())}
                placeholder="PR001"
              />
            </Field>
            <Field label="Serie de orden de compra" required>
              <input
                className={inputClass}
                value={empresa.serieOrdenCompra}
                onChange={(e) => updateEmpresa("serieOrdenCompra", e.target.value.toUpperCase())}
                placeholder="OC001"
              />
            </Field>
            <Field label="Serie de orden de pedido" required>
              <input
                className={inputClass}
                value={empresa.serieOrdenPedido}
                onChange={(e) => updateEmpresa("serieOrdenPedido", e.target.value.toUpperCase())}
                placeholder="OP001"
              />
            </Field>
            <Field label="Serie de orden de servicio" required>
              <input
                className={inputClass}
                value={empresa.serieOrdenServicio}
                onChange={(e) => updateEmpresa("serieOrdenServicio", e.target.value.toUpperCase())}
                placeholder="OS001"
              />
            </Field>
            <p className="sm:col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Estos parámetros se usarán en comprobantes, ventas y reportes contables.
            </p>
          </div>
        )}

        {currentStep.id === "trabajadores" && (
          <OnboardingTrabajadoresEditor
            trabajadores={trabajadores}
            onChange={setTrabajadores}
            inputClassName="bg-[#eef2f8] border-transparent"
          />
        )}

        {currentStep.id === "contador" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Opcional: registra al contador o asesor contable de tu empresa para futuras invitaciones.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del contador">
                <input
                  className={inputClass}
                  value={contador.nombre}
                  onChange={(e) => setContador((current) => ({ ...current, nombre: e.target.value }))}
                  placeholder="María López"
                />
              </Field>
              <Field label="Correo del contador">
                <input
                  type="email"
                  className={inputClass}
                  value={contador.email}
                  onChange={(e) => setContador((current) => ({ ...current, email: e.target.value }))}
                  placeholder="contador@miempresa.pe"
                />
              </Field>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-1 rounded-[10px]"
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </Button>
            )}
            {(currentStep.id === "trabajadores" || currentStep.id === "contador") && (
              <Button
                type="button"
                variant="ghost"
                onClick={skipToFinish}
                className="rounded-[10px] text-slate-500"
                disabled={isSubmitting}
              >
                {currentStep.id === "contador" ? "Omitir y finalizar" : "Omitir paso"}
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 gap-1 rounded-[10px] bg-[#0b7cff] px-6 text-sm font-semibold hover:bg-[#0066e0]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isLastStep ? (
              <>
                Finalizar configuración
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
