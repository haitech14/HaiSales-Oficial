import { FileInput, Store, Truck } from "lucide-react";
import type { GuiaFilterMode } from "@/lib/logistica/guias-page-utils";
import { cn } from "@/lib/utils";

type GuiasFilterBarProps = {
  mode: GuiaFilterMode;
  onModeChange: (mode: GuiaFilterMode) => void;
  className?: string;
};

export function GuiasFilterBar({ mode, onModeChange, className }: GuiasFilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => onModeChange("todos")}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
          mode === "todos"
            ? "bg-[#1e3354] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <FileInput className="h-4 w-4 shrink-0" strokeWidth={2} />
        Todos
      </button>

      <button
        type="button"
        onClick={() => onModeChange("sucursal")}
        aria-label="Sucursal"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition",
          mode === "sucursal"
            ? "bg-[#1e3354] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <Store className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onModeChange("traslado")}
        aria-label="Traslado"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition",
          mode === "traslado"
            ? "bg-[#1e3354] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <Truck className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
