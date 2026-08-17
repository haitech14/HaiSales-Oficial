import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CarFront,
  ChevronRight,
  CircleCheck,
  FileCheck,
  Files,
  HandCoins,
  Landmark,
  MessageCircle,
  MessagesSquare,
  Truck,
} from "lucide-react";
import { OutlinedField } from "@/components/app/OutlinedField";
import { Button } from "@/components/ui/button";
import { ventaFormasPago } from "@/lib/nueva-venta-mock-data";
import { cn } from "@/lib/utils";
import { nuevaVentaPlainControlClass } from "./nueva-venta-ui-utils";

type OpcionId =
  | "placa"
  | "orden-compra"
  | "guias"
  | "observaciones"
  | "condicion-pago"
  | "otros-datos"
  | "documentos"
  | "detraccion"
  | "retencion"
  | "percepcion"
  | "anticipos"
  | "recargo";

type OpcionesExtra = {
  placa: string;
  ordenCompra: string;
  guiaRemision: string;
  otrosDatos: string;
  documentosRelacionados: string;
  detraccion: string;
  retencion: string;
  percepcion: string;
  anticipos: string;
  recargo: string;
};

const EMPTY_EXTRA: OpcionesExtra = {
  placa: "",
  ordenCompra: "",
  guiaRemision: "",
  otrosDatos: "",
  documentosRelacionados: "",
  detraccion: "",
  retencion: "",
  percepcion: "",
  anticipos: "",
  recargo: "",
};

const OPCIONES: Array<{
  id: OpcionId;
  label: string;
  icon: typeof CarFront;
  iconClassName?: string;
}> = [
  { id: "placa", label: "Placa", icon: CarFront },
  { id: "orden-compra", label: "Orden De Compra", icon: FileCheck },
  { id: "guias", label: "Guias De Remisión", icon: Truck },
  { id: "observaciones", label: "Observaciones", icon: MessageCircle },
  { id: "condicion-pago", label: "Condición De Pago", icon: CircleCheck, iconClassName: "text-emerald-500" },
  { id: "otros-datos", label: "Otros Datos Adicionales", icon: MessagesSquare },
  { id: "documentos", label: "Documentos Relacionados", icon: Files },
  { id: "detraccion", label: "Detracción (Spot)", icon: Landmark },
  { id: "retencion", label: "Retención", icon: Landmark },
  { id: "percepcion", label: "Percepción", icon: Landmark },
  { id: "anticipos", label: "Anticipos", icon: Banknote },
  { id: "recargo", label: "Recargo Al Consumo", icon: HandCoins },
];

type NuevaVentaOpcionesListProps = {
  formaPago: string;
  observacionGeneral: string;
  onFormaPagoChange: (value: string) => void;
  onObservacionChange: (value: string) => void;
  onGuiaRemision: () => void;
};

export function NuevaVentaOpcionesList({
  formaPago,
  observacionGeneral,
  onFormaPagoChange,
  onObservacionChange,
  onGuiaRemision,
}: NuevaVentaOpcionesListProps) {
  const [activeId, setActiveId] = useState<OpcionId | null>(null);
  const [extra, setExtra] = useState<OpcionesExtra>(EMPTY_EXTRA);

  const active = OPCIONES.find((item) => item.id === activeId) ?? null;

  const updateExtra = (key: keyof OpcionesExtra, value: string) => {
    setExtra((current) => ({ ...current, [key]: value }));
  };

  if (active) {
    return (
      <div className="flex min-h-[520px] flex-col">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          {active.label}
        </button>

        <div className="space-y-4">
          {active.id === "placa" ? (
            <OutlinedField label="Placa">
              <input
                value={extra.placa}
                onChange={(event) => updateExtra("placa", event.target.value.toUpperCase())}
                placeholder="ABC-123"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "orden-compra" ? (
            <OutlinedField label="N° orden de compra">
              <input
                value={extra.ordenCompra}
                onChange={(event) => updateExtra("ordenCompra", event.target.value)}
                placeholder="OC-000123"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "guias" ? (
            <>
              <OutlinedField label="Guía de remisión">
                <input
                  value={extra.guiaRemision}
                  onChange={(event) => updateExtra("guiaRemision", event.target.value)}
                  placeholder="T001-000012"
                  className={nuevaVentaPlainControlClass}
                />
              </OutlinedField>
              <Button
                type="button"
                variant="outline"
                onClick={onGuiaRemision}
                className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Emitir guía de remisión
              </Button>
            </>
          ) : null}

          {active.id === "observaciones" ? (
            <OutlinedField label="Observaciones" contentClassName="items-start py-2">
              <textarea
                value={observacionGeneral}
                onChange={(event) => onObservacionChange(event.target.value)}
                placeholder="Notas para la venta, entrega o facturación"
                rows={5}
                className="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </OutlinedField>
          ) : null}

          {active.id === "condicion-pago" ? (
            <div className="space-y-2">
              {ventaFormasPago.map((opcion) => {
                const selected = formaPago === opcion;
                return (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => onFormaPagoChange(opcion)}
                    className={cn(
                      "flex h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-sm font-medium transition",
                      selected
                        ? "border-blue-500 text-blue-700"
                        : "border-transparent text-slate-700 hover:border-slate-200",
                    )}
                  >
                    {opcion}
                    {selected ? <CircleCheck className="h-4 w-4 text-blue-500" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {active.id === "otros-datos" ? (
            <OutlinedField label="Datos adicionales" contentClassName="items-start py-2">
              <textarea
                value={extra.otrosDatos}
                onChange={(event) => updateExtra("otrosDatos", event.target.value)}
                placeholder="Información extra del comprobante"
                rows={5}
                className="w-full resize-y border-0 bg-transparent px-0 py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </OutlinedField>
          ) : null}

          {active.id === "documentos" ? (
            <OutlinedField label="Documento relacionado">
              <input
                value={extra.documentosRelacionados}
                onChange={(event) => updateExtra("documentosRelacionados", event.target.value)}
                placeholder="F001-000123"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "detraccion" ? (
            <OutlinedField label="Detracción (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={extra.detraccion}
                onChange={(event) => updateExtra("detraccion", event.target.value)}
                placeholder="0"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "retencion" ? (
            <OutlinedField label="Retención (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={extra.retencion}
                onChange={(event) => updateExtra("retencion", event.target.value)}
                placeholder="0"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "percepcion" ? (
            <OutlinedField label="Percepción (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={extra.percepcion}
                onChange={(event) => updateExtra("percepcion", event.target.value)}
                placeholder="0"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "anticipos" ? (
            <OutlinedField label="Anticipo">
              <input
                type="number"
                min="0"
                step="0.01"
                value={extra.anticipos}
                onChange={(event) => updateExtra("anticipos", event.target.value)}
                placeholder="0.00"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}

          {active.id === "recargo" ? (
            <OutlinedField label="Recargo al consumo (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={extra.recargo}
                onChange={(event) => updateExtra("recargo", event.target.value)}
                placeholder="0"
                className={nuevaVentaPlainControlClass}
              />
            </OutlinedField>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-2">
      {OPCIONES.map((item) => {
        const Icon = item.icon;
        const badge = item.id === "condicion-pago" && formaPago ? formaPago : null;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-left shadow-sm transition hover:bg-slate-50"
          >
            <Icon className={cn("h-5 w-5 shrink-0 text-blue-500", item.iconClassName)} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
              {item.label}
            </span>
            {badge ? (
              <span className="shrink-0 rounded-full bg-blue-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {badge}
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </button>
        );
      })}
    </div>
  );
}
