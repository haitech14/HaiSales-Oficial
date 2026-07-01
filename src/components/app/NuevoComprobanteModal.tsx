import {
  Calendar,
  ChevronDown,
  CirclePlus,
  CreditCard,
  Eye,
  FileText,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  User,
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

type NuevoComprobanteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function FieldInput({
  icon: Icon,
  rightIcon: RightIcon,
  suffix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  suffix?: string;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon && "pl-9",
          (RightIcon || suffix) && "pr-10",
          className,
        )}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {suffix}
        </span>
      )}
      {RightIcon && !suffix && (
        <RightIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
    </div>
  );
}

export function NuevoComprobanteModal({ open, onOpenChange }: NuevoComprobanteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto gap-0 border-slate-200 p-0 sm:rounded-2xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nuevo comprobante</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-sm text-slate-500">
                Emite facturas, boletas o notas de crédito conectadas a ventas, clientes e inventario.
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
              <FieldLabel required>Cliente / RUC</FieldLabel>
              <FieldInput
                icon={Search}
                rightIcon={ChevronDown}
                placeholder="Buscar por nombre, razón social o RUC"
              />
            </div>
            <div>
              <FieldLabel required>Moneda</FieldLabel>
              <FieldInput defaultValue="PEN - Soles" rightIcon={ChevronDown} readOnly />
            </div>

            <div>
              <FieldLabel required>Dirección fiscal</FieldLabel>
              <FieldInput
                icon={Search}
                rightIcon={ChevronDown}
                placeholder="Seleccionar o buscar dirección fiscal"
              />
            </div>
            <div>
              <FieldLabel required>Forma de pago</FieldLabel>
              <FieldInput icon={CreditCard} defaultValue="Contado" rightIcon={ChevronDown} readOnly />
            </div>

            <div>
              <FieldLabel required>Tipo de comprobante</FieldLabel>
              <FieldInput icon={FileText} defaultValue="Factura electrónica" rightIcon={ChevronDown} readOnly />
            </div>
            <div>
              <FieldLabel required>Fecha de emisión</FieldLabel>
              <FieldInput icon={Calendar} defaultValue="30/06/2026" rightIcon={Calendar} readOnly />
            </div>

            <div>
              <FieldLabel required>Serie</FieldLabel>
              <FieldInput icon={FileText} rightIcon={ChevronDown} placeholder="Seleccionar serie" />
            </div>
            <div>
              <FieldLabel>Fecha de vencimiento</FieldLabel>
              <FieldInput
                icon={Calendar}
                rightIcon={Calendar}
                placeholder="Seleccionar fecha (opcional)"
              />
            </div>

            <div>
              <FieldLabel required>Producto o servicio</FieldLabel>
              <FieldInput icon={Search} rightIcon={Search} placeholder="Buscar producto o servicio" />
            </div>
            <div>
              <FieldLabel required>Vendedor</FieldLabel>
              <FieldInput icon={User} rightIcon={ChevronDown} placeholder="Seleccionar vendedor" />
            </div>

            <div>
              <FieldLabel required>Cantidad</FieldLabel>
              <FieldInput placeholder="Ingresa la cantidad" suffix="UND" type="number" min={1} />
            </div>
            <div>
              <FieldLabel>Observación interna</FieldLabel>
              <Textarea
                placeholder="Agregar observación (opcional)"
                className="min-h-[88px] resize-none rounded-lg border-slate-200 text-sm placeholder:text-slate-400 focus-visible:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-700">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              Traer desde venta
            </Button>
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-700">
              <CirclePlus className="h-4 w-4 text-blue-600" />
              Agregar item
            </Button>
            <Button type="button" variant="outline" className="h-9 gap-2 border-slate-200 text-slate-700">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Validar RUC
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Subtotal</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">IGV (18%)</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total</p>
              <p className="mt-1 text-xl font-bold text-blue-600">S/ 0.00</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Estado SUNAT</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Listo para enviar</span>
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
            <Button type="button" variant="outline" className="h-10 gap-2 border-blue-200 px-5 text-blue-600 hover:bg-blue-50">
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
            <Button type="button" className="h-10 gap-2 bg-blue-600 px-5 font-semibold hover:bg-blue-500">
              <Send className="h-4 w-4" />
              Emitir comprobante
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
