import { useEffect, useState } from "react";
import { Building2, Target, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateOportunidadInput } from "@/lib/crm/crm-service";
import { cn } from "@/lib/utils";

export type NuevoProspectoFormState = {
  clienteNombre: string;
  clienteRuc: string;
  titulo: string;
  valor: string;
};

export const defaultNuevoProspectoForm: NuevoProspectoFormState = {
  clienteNombre: "",
  clienteRuc: "",
  titulo: "",
  valor: "",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
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
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof User }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          className,
        )}
      />
    </div>
  );
}

type NuevoProspectoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (input: CreateOportunidadInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function NuevoProspectoModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: NuevoProspectoModalProps) {
  const [form, setForm] = useState<NuevoProspectoFormState>(defaultNuevoProspectoForm);

  useEffect(() => {
    if (!open) {
      setForm(defaultNuevoProspectoForm);
    }
  }, [open]);

  const updateField = <K extends keyof NuevoProspectoFormState>(
    key: K,
    value: NuevoProspectoFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clienteNombre = form.clienteNombre.trim();
    if (!clienteNombre) return;

    const valor = form.valor.trim() ? Number(form.valor.replace(/,/g, "")) : 0;
    const titulo = form.titulo.trim() || `Oportunidad — ${clienteNombre}`;

    await onSubmit?.({
      clienteNombre,
      clienteRuc: form.clienteRuc.trim() || undefined,
      titulo,
      subtitulo: "Prospecto nuevo",
      valor: Number.isFinite(valor) ? valor : 0,
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto p-0 sm:rounded-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-6">
          <div>
            <DialogTitle className="text-left text-lg">Nuevo prospecto</DialogTitle>
            <DialogDescription className="text-left">
              Registra la oportunidad antes de agregarla al pipeline.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="px-6 pb-6 pt-4">
          <div className="space-y-4">
            <div>
              <FieldLabel required>Nombre del prospecto</FieldLabel>
              <InputWithIcon
                icon={User}
                value={form.clienteNombre}
                onChange={(event) => updateField("clienteNombre", event.target.value)}
                placeholder="Ej. Ferretería El Sol"
                autoFocus
              />
            </div>

            <div>
              <FieldLabel>RUC / documento</FieldLabel>
              <InputWithIcon
                icon={Building2}
                value={form.clienteRuc}
                onChange={(event) => updateField("clienteRuc", event.target.value)}
                placeholder="Opcional"
                inputMode="numeric"
              />
            </div>

            <div>
              <FieldLabel>Título de la oportunidad</FieldLabel>
              <InputWithIcon
                icon={Target}
                value={form.titulo}
                onChange={(event) => updateField("titulo", event.target.value)}
                placeholder="Opcional — se genera automáticamente"
              />
            </div>

            <div>
              <FieldLabel>Valor estimado (S/)</FieldLabel>
              <input
                type="text"
                inputMode="decimal"
                value={form.valor}
                onChange={(event) => updateField("valor", event.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" className="text-slate-600 hover:text-slate-800" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!form.clienteNombre.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isSubmitting ? "Creando..." : "Crear oportunidad"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
