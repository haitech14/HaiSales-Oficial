import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { Opportunity } from "@/lib/crm-mock-data";
import type { CreateOportunidadInput, OpportunityStage } from "@/lib/crm/crm-service";
import { cn } from "@/lib/utils";

type FormState = {
  titulo: string;
  empresa: string;
  contacto: string;
  valor: string;
  probabilidad: string;
  etapa: OpportunityStage;
  fuente: string;
  notas: string;
  crearOtra: boolean;
};

const defaultForm: FormState = {
  titulo: "",
  empresa: "",
  contacto: "",
  valor: "",
  probabilidad: "50",
  etapa: "Prospectos",
  fuente: "WhatsApp",
  notas: "",
  crearOtra: false,
};

const ETAPA_OPTIONS: { value: OpportunityStage; label: string; dot: string }[] = [
  { value: "Prospectos", label: "Prospección", dot: "bg-blue-500" },
  { value: "Calificación", label: "Calificación", dot: "bg-amber-400" },
  { value: "Propuesta", label: "Cotización", dot: "bg-violet-500" },
  { value: "Negociación", label: "Negociación", dot: "bg-orange-500" },
  { value: "Cierre ganado", label: "Ganada", dot: "bg-emerald-500" },
];

const FUENTE_OPTIONS = ["WhatsApp", "Facebook", "Instagram", "Web", "Referido", "Manual"];

const PROBABILIDAD_OPTIONS = ["10", "25", "50", "75", "90", "100"];

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "appearance-none pr-9", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function formFromOpportunity(item: Opportunity): FormState {
  const fuenteMatch = item.subtitle.match(/Fuente:\s*([^·]+)/i);
  const fuenteFromSubtitle = fuenteMatch?.[1]?.trim() ?? "";
  const fuente =
    FUENTE_OPTIONS.find((option) => option.toLowerCase() === fuenteFromSubtitle.toLowerCase()) ??
    FUENTE_OPTIONS.find((option) => item.subtitle.toLowerCase().includes(option.toLowerCase())) ??
    "WhatsApp";
  const notas = item.subtitle
    .replace(/·?\s*Fuente:\s*[^·]+/gi, "")
    .replace(/^·\s*|·\s*$/g, "")
    .trim();

  return {
    titulo: item.title,
    empresa: item.client,
    contacto: "",
    valor: item.value ? String(item.value) : "",
    probabilidad: String(item.probability || 50),
    etapa: item.stage,
    fuente,
    notas,
    crearOtra: false,
  };
}

type NuevoProspectoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (input: CreateOportunidadInput) => Promise<void>;
  isSubmitting?: boolean;
  opportunity?: Opportunity | null;
};

export function NuevoProspectoModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  opportunity = null,
}: NuevoProspectoModalProps) {
  const isEdit = Boolean(opportunity);
  const { displayName, initials, avatarUrl } = useUserProfile();
  const [form, setForm] = useState<FormState>(defaultForm);
  const empresaRef = useRef<HTMLInputElement>(null);
  const contactoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      return;
    }
    setForm(opportunity ? formFromOpportunity(opportunity) : defaultForm);
  }, [open, opportunity]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const titulo = form.titulo.trim();
    if (!titulo) return;

    const clienteNombre = form.empresa.trim() || form.contacto.trim() || titulo;
    const valor = form.valor.trim() ? Number(form.valor.replace(/,/g, "")) : 0;
    const contacto = form.contacto.trim();
    const notas = form.notas.trim();

    await onSubmit?.({
      clienteNombre,
      titulo,
      subtitulo: [contacto, notas].filter(Boolean).join(" · ") || undefined,
      valor: Number.isFinite(valor) ? valor : 0,
      probabilidad: Number(form.probabilidad) || 50,
      etapa: form.etapa,
      fuente: form.fuente,
      notas: notas || undefined,
    });

    if (!isEdit && form.crearOtra) {
      setForm((current) => ({
        ...defaultForm,
        crearOtra: true,
        etapa: current.etapa,
        fuente: current.fuente,
        probabilidad: current.probabilidad,
      }));
      return;
    }

    handleClose();
  };

  const etapaMeta = ETAPA_OPTIONS.find((option) => option.value === form.etapa) ?? ETAPA_OPTIONS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-900/25"
        hideClose
        className={cn(
          "fixed left-auto right-5 top-1/2 z-50 flex max-h-[min(92vh,740px)] w-[min(calc(100vw-1.5rem),400px)] translate-x-0 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:rounded-2xl",
          "data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4",
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-5">
          <DialogTitle className="text-left text-[17px] font-bold text-slate-900">
            {isEdit ? "Editar oportunidad" : "Nueva oportunidad"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Actualiza los datos de la oportunidad en el pipeline."
              : "Completa los datos para registrar una oportunidad en el pipeline."}
          </DialogDescription>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 pb-4 pt-2">
            <p className="text-[13px] font-semibold text-blue-600">Información general</p>

            <div>
              <FieldLabel required>Nombre</FieldLabel>
              <input
                value={form.titulo}
                onChange={(event) => updateField("titulo", event.target.value)}
                placeholder="Ej. Venta de software CRM"
                className={fieldClass}
                autoFocus
              />
            </div>

            <div>
              <FieldLabel>Empresa</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    ref={empresaRef}
                    value={form.empresa}
                    onChange={(event) => updateField("empresa", event.target.value)}
                    placeholder="Buscar empresa..."
                    className={cn(fieldClass, "pr-9")}
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => empresaRef.current?.focus()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Agregar empresa"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <FieldLabel>Contacto</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    ref={contactoRef}
                    value={form.contacto}
                    onChange={(event) => updateField("contacto", event.target.value)}
                    placeholder="Buscar contacto..."
                    className={cn(fieldClass, "pr-9")}
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => contactoRef.current?.focus()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Agregar contacto"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Valor estimado</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    S/
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor}
                    onChange={(event) => updateField("valor", event.target.value)}
                    placeholder="0.00"
                    className={cn(fieldClass, "pl-8")}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Probabilidad (%)</FieldLabel>
                <SelectField value={form.probabilidad} onChange={(value) => updateField("probabilidad", value)}>
                  {(PROBABILIDAD_OPTIONS.includes(form.probabilidad)
                    ? PROBABILIDAD_OPTIONS
                    : [...PROBABILIDAD_OPTIONS, form.probabilidad].sort((a, b) => Number(a) - Number(b))
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option} %
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Etapa</FieldLabel>
                <div className="relative">
                  <span className={cn("pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full", etapaMeta.dot)} />
                  <select
                    value={form.etapa}
                    onChange={(event) => updateField("etapa", event.target.value as OpportunityStage)}
                    className={cn(fieldClass, "appearance-none pl-8 pr-9")}
                  >
                    {ETAPA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <FieldLabel>Responsable</FieldLabel>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-semibold text-blue-700">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{displayName}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Fuente</FieldLabel>
              <SelectField value={form.fuente} onChange={(value) => updateField("fuente", value)}>
                {FUENTE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <FieldLabel>Notas</FieldLabel>
              <textarea
                value={form.notas}
                onChange={(event) => updateField("notas", event.target.value)}
                placeholder="Escribe una nota..."
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            {isEdit ? (
              <span />
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600">
                <input
                  type="checkbox"
                  checked={form.crearOtra}
                  onChange={(event) => updateField("crearOtra", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Crear otra oportunidad
              </label>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="h-10 rounded-lg bg-slate-100 px-4 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!form.titulo.trim() || isSubmitting}
                className="h-10 rounded-lg bg-blue-600 px-5 hover:bg-blue-500"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
