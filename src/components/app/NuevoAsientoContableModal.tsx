import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  FileText,
  Search,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type NuevoAsientoContableModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-700">{children}</label>;
}

function FieldInput({
  icon: Icon,
  rightIcon: RightIcon,
  prefix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
          {prefix}
        </span>
      )}
      <input
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon && "pl-9",
          prefix && "pl-10",
          RightIcon && "pr-10",
          className,
        )}
        {...props}
      />
      {RightIcon && (
        <RightIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
    </div>
  );
}

export function NuevoAsientoContableModal({ open, onOpenChange }: NuevoAsientoContableModalProps) {
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto gap-0 border-slate-200 p-0 sm:rounded-2xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nuevo asiento contable</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Registra movimientos contables conectados a ventas, compras, bancos y tesorería.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Tipo de asiento</FieldLabel>
              <FieldInput placeholder="Seleccione tipo" rightIcon={ChevronDown} />
            </div>
            <div>
              <FieldLabel>Cuenta haber</FieldLabel>
              <FieldInput placeholder="Buscar cuenta contable..." rightIcon={Search} />
            </div>

            <div>
              <FieldLabel>Fecha contable</FieldLabel>
              <FieldInput icon={Calendar} defaultValue="30/06/2026" readOnly />
            </div>
            <div>
              <FieldLabel>Moneda</FieldLabel>
              <FieldInput defaultValue="Soles (PEN)" rightIcon={ChevronDown} readOnly />
            </div>

            <div>
              <FieldLabel>Cuenta debe</FieldLabel>
              <FieldInput placeholder="Buscar cuenta contable..." rightIcon={Search} />
            </div>
            <div>
              <FieldLabel>Importe</FieldLabel>
              <FieldInput prefix="S/" defaultValue="0.00" type="number" step="0.01" min={0} />
            </div>

            <div>
              <FieldLabel>Documento vinculado</FieldLabel>
              <FieldInput placeholder="Buscar documento..." rightIcon={Search} />
            </div>
            <div>
              <FieldLabel>Origen</FieldLabel>
              <FieldInput placeholder="Seleccione origen" rightIcon={ChevronDown} />
            </div>

            <div>
              <FieldLabel>Centro de costo</FieldLabel>
              <FieldInput placeholder="Seleccione centro de costo" rightIcon={ChevronDown} />
            </div>
            <div>
              <FieldLabel>Estado</FieldLabel>
              <FieldInput defaultValue="Borrador" rightIcon={ChevronDown} readOnly />
            </div>

            <div className="sm:col-span-1">
              <FieldLabel>Descripción</FieldLabel>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 200))}
                  placeholder="Ingrese la descripción del asiento..."
                  className="min-h-[88px] resize-none rounded-lg border-slate-200 pb-6 text-sm placeholder:text-slate-400 focus-visible:ring-blue-600/20"
                />
                <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                  {description.length}/200
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>Responsable</FieldLabel>
              <FieldInput placeholder="Seleccione responsable" rightIcon={ChevronDown} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
              <FileText className="h-4 w-4" />
              Traer comprobante
            </button>
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
              <CirclePlus className="h-4 w-4" />
              Agregar línea
            </button>
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
              <Building2 className="h-4 w-4" />
              Conciliar banco
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Debe</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Haber</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Diferencia</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Estado del asiento</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Balanceado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 border-slate-200 px-5 text-slate-700"
          >
            Cancelar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-10 border-blue-200 px-5 text-blue-600 hover:bg-blue-50">
              Guardar borrador
            </Button>
            <Button type="button" className="h-10 gap-2 bg-blue-600 px-5 font-semibold hover:bg-blue-500">
              <Send className="h-4 w-4" />
              Publicar asiento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
