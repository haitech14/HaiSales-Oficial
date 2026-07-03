import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trabajadorAreas } from "@/lib/planillas-form-data";
import {
  createOnboardingTrabajadorId,
  type OnboardingTrabajadorDraft,
} from "@/lib/parametros/onboarding-trabajador-data";
import { cn } from "@/lib/utils";

type OnboardingTrabajadoresEditorProps = {
  trabajadores: OnboardingTrabajadorDraft[];
  onChange: (trabajadores: OnboardingTrabajadorDraft[]) => void;
  inputClassName?: string;
};

function getTrabajadorSummary(trabajador: OnboardingTrabajadorDraft): string {
  if (trabajador.nombresApellidos.trim()) return trabajador.nombresApellidos.trim();
  if (trabajador.dni.trim()) return `DNI ${trabajador.dni}`;
  return "Sin datos";
}

export function OnboardingTrabajadoresEditor({
  trabajadores,
  onChange,
  inputClassName,
}: OnboardingTrabajadoresEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (trabajadores.length === 0) {
      setExpandedId(null);
      return;
    }
    if (!expandedId || !trabajadores.some((item) => item.id === expandedId)) {
      setExpandedId(trabajadores[trabajadores.length - 1].id);
    }
  }, [trabajadores, expandedId]);

  const inputCls = cn(
    "h-11 w-full rounded-[10px] px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
    inputClassName ?? "border-transparent bg-white",
  );

  const addTrabajador = () => {
    const nuevo = createOnboardingTrabajadorId();
    onChange([...trabajadores, nuevo]);
    setExpandedId(nuevo.id);
  };

  const updateTrabajador = (id: string, patch: Partial<OnboardingTrabajadorDraft>) => {
    onChange(trabajadores.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeTrabajador = (id: string) => {
    onChange(trabajadores.filter((item) => item.id !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const expandTrabajador = (id: string) => {
    setExpandedId(id);
  };

  return (
    <div className="space-y-3">
      {trabajadores.length === 0 && (
        <p className="text-sm text-slate-500">
          Opcional: agrega trabajadores de tu equipo con horario y datos de planilla.
        </p>
      )}

      {trabajadores.map((trabajador, index) => {
        const isExpanded = expandedId === trabajador.id;

        return (
        <div
          key={trabajador.id}
          className={cn(
            "rounded-[12px] border border-slate-200 bg-slate-50/80",
            isExpanded ? "p-4" : "p-3",
          )}
          onFocusCapture={() => expandTrabajador(trabajador.id)}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              onClick={() => expandTrabajador(trabajador.id)}
              aria-expanded={isExpanded}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trabajador {index + 1}
                </span>
                {!isExpanded && (
                  <p className="truncate text-sm text-slate-700">{getTrabajadorSummary(trabajador)}</p>
                )}
              </div>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-rose-500 hover:text-rose-600"
              onClick={() => removeTrabajador(trabajador.id)}
              aria-label="Eliminar trabajador"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isExpanded && (
          <>
          <div className="mb-3 mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">DNI</span>
              <input
                className={inputCls}
                value={trabajador.dni}
                onChange={(e) =>
                  updateTrabajador(trabajador.id, {
                    dni: e.target.value.replace(/\D/g, "").slice(0, 8),
                  })
                }
                placeholder="12345678"
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
                Nombres y apellidos
              </span>
              <input
                className={inputCls}
                value={trabajador.nombresApellidos}
                onChange={(e) =>
                  updateTrabajador(trabajador.id, { nombresApellidos: e.target.value })
                }
                placeholder="Juan Pérez García"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">Área</span>
              <select
                className={inputCls}
                value={trabajador.area}
                onChange={(e) => updateTrabajador(trabajador.id, { area: e.target.value })}
              >
                <option value="">Seleccionar área</option>
                {trabajadorAreas.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
                Sueldo básico (S/)
              </span>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={trabajador.sueldoBasico}
                onChange={(e) => updateTrabajador(trabajador.id, { sueldoBasico: e.target.value })}
                placeholder="2500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
                Horario de ingreso
              </span>
              <input
                type="time"
                className={inputCls}
                value={trabajador.horaEntrada}
                onChange={(e) => updateTrabajador(trabajador.id, { horaEntrada: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">Salida</span>
              <input
                type="time"
                className={inputCls}
                value={trabajador.horaSalida}
                onChange={(e) => updateTrabajador(trabajador.id, { horaSalida: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
                Refrigerio <span className="font-normal text-slate-400">(opcional)</span>
              </span>
              <input
                type="time"
                className={inputCls}
                value={trabajador.horaRefrigerio}
                onChange={(e) => updateTrabajador(trabajador.id, { horaRefrigerio: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white/80 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={trabajador.enPlanilla}
                onChange={(e) =>
                  updateTrabajador(trabajador.id, {
                    enPlanilla: e.target.checked,
                    sistemaPensiones: e.target.checked ? trabajador.sistemaPensiones : "",
                    seguroSalud: e.target.checked ? trabajador.seguroSalud : "",
                  })
                }
              />
              En planilla
            </label>

            {trabajador.enPlanilla && (
              <div className="grid gap-3 sm:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-slate-600">Sistema de pensiones</legend>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input
                      type="radio"
                      name={`pension-${trabajador.id}`}
                      checked={trabajador.sistemaPensiones === "afp"}
                      onChange={() => updateTrabajador(trabajador.id, { sistemaPensiones: "afp" })}
                    />
                    AFP
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input
                      type="radio"
                      name={`pension-${trabajador.id}`}
                      checked={trabajador.sistemaPensiones === "onp"}
                      onChange={() => updateTrabajador(trabajador.id, { sistemaPensiones: "onp" })}
                    />
                    ONP
                  </label>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-slate-600">Seguro de salud</legend>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input
                      type="radio"
                      name={`salud-${trabajador.id}`}
                      checked={trabajador.seguroSalud === "essalud"}
                      onChange={() => updateTrabajador(trabajador.id, { seguroSalud: "essalud" })}
                    />
                    ESSALUD
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input
                      type="radio"
                      name={`salud-${trabajador.id}`}
                      checked={trabajador.seguroSalud === "sis"}
                      onChange={() => updateTrabajador(trabajador.id, { seguroSalud: "sis" })}
                    />
                    SIS
                  </label>
                </fieldset>
              </div>
            )}
          </div>
          </>
          )}
        </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addTrabajador}
        className="h-10 w-full gap-2 rounded-[10px] border-dashed text-sm"
      >
        <Plus className="h-4 w-4" />
        Agregar trabajador
      </Button>
    </div>
  );
}
