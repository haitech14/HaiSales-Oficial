import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSedeId,
  formatSerieCotizacion,
  SERIE_COTIZACION_PREFIX,
  type EmpresaSede,
} from "@/lib/parametros/empresa-config-data";
import { cn } from "@/lib/utils";

type SedesEditorProps = {
  sedes: EmpresaSede[];
  onChange: (sedes: EmpresaSede[]) => void;
  inputClassName?: string;
  /** Prefijo de serie de cotización (p. ej. C001-). El sufijo 001/002 es por sucursal. */
  serieCotizacionPrefix?: string;
};

export function SedesEditor({
  sedes,
  onChange,
  inputClassName,
  serieCotizacionPrefix = SERIE_COTIZACION_PREFIX,
}: SedesEditorProps) {
  const addSede = () => {
    const index = sedes.length;
    onChange([
      ...sedes,
      {
        id: createSedeId(),
        nombre: "",
        direccion: "",
        serieCotizacion: formatSerieCotizacion(index, serieCotizacionPrefix),
        esPrincipal: sedes.length === 0,
      },
    ]);
  };

  const updateSede = (id: string, patch: Partial<EmpresaSede>) => {
    onChange(sedes.map((sede) => (sede.id === id ? { ...sede, ...patch } : sede)));
  };

  const removeSede = (id: string) => {
    const remaining = sedes
      .map((sede, index) => ({ sede, index }))
      .filter(({ sede }) => sede.id !== id);

    const next = remaining.map(({ sede, index: oldIndex }, newIndex) => {
      const wasAuto =
        !sede.serieCotizacion?.trim() ||
        sede.serieCotizacion === formatSerieCotizacion(oldIndex, serieCotizacionPrefix);
      return {
        ...sede,
        serieCotizacion: wasAuto
          ? formatSerieCotizacion(newIndex, serieCotizacionPrefix)
          : sede.serieCotizacion,
      };
    });

    if (next.length > 0 && !next.some((sede) => sede.esPrincipal)) {
      next[0] = { ...next[0], esPrincipal: true };
    }
    onChange(next);
  };

  const setPrincipal = (id: string) => {
    onChange(sedes.map((sede) => ({ ...sede, esPrincipal: sede.id === id })));
  };

  return (
    <div className="space-y-3">
      {sedes.length === 0 && (
        <p className="text-sm text-slate-500">
          Agrega las sucursales o locales de tu empresa. Puedes marcar una como principal.
        </p>
      )}

      {sedes.map((sede, index) => (
        <div
          key={sede.id}
          className="rounded-[12px] border border-slate-200 bg-slate-50/80 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sucursal {index + 1}
              {sede.esPrincipal && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Principal
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {!sede.esPrincipal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-slate-500"
                  onClick={() => setPrincipal(sede.id)}
                >
                  <Star className="h-3.5 w-3.5" />
                  Principal
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-rose-500 hover:text-rose-600"
                onClick={() => removeSede(sede.id)}
                aria-label="Eliminar sucursal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">Nombre de la sucursal</span>
              <input
                className={cn(
                  "h-11 w-full rounded-[10px] border-transparent bg-white px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
                  inputClassName,
                )}
                value={sede.nombre}
                onChange={(event) => updateSede(sede.id, { nombre: event.target.value })}
                placeholder="Ej. Sucursal Lima Centro"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">Dirección</span>
              <input
                className={cn(
                  "h-11 w-full rounded-[10px] border-transparent bg-white px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
                  inputClassName,
                )}
                value={sede.direccion}
                onChange={(event) => updateSede(sede.id, { direccion: event.target.value })}
                placeholder="Av. Principal 123, Lima"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-800">
                Serie cotización
              </span>
              <input
                className={cn(
                  "h-11 w-full rounded-[10px] border-transparent bg-white px-3 text-[13px] uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
                  inputClassName,
                )}
                value={sede.serieCotizacion ?? formatSerieCotizacion(index, serieCotizacionPrefix)}
                onChange={(event) =>
                  updateSede(sede.id, { serieCotizacion: event.target.value.toUpperCase() })
                }
                placeholder={formatSerieCotizacion(index, serieCotizacionPrefix)}
              />
            </label>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSede}
        className="h-10 w-full gap-2 rounded-[10px] border-dashed text-sm"
      >
        <Plus className="h-4 w-4" />
        Agregar sucursal
      </Button>
    </div>
  );
}
