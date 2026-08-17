import { ClipboardList, Mail, ShoppingCart } from "lucide-react";
import type { ComprasFilterMode } from "@/lib/logistica/compras-page-utils";
import { cn } from "@/lib/utils";

type ComprasFilterBarProps = {
  mode: ComprasFilterMode;
  onModeChange: (mode: ComprasFilterMode) => void;
  className?: string;
};

export function ComprasFilterBar({ mode, onModeChange, className }: ComprasFilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => onModeChange("compras")}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
          mode === "compras"
            ? "bg-[#2563eb] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <ShoppingCart className="h-4 w-4" strokeWidth={2} />
        Compras
      </button>

      <button
        type="button"
        onClick={() => onModeChange("requisiciones")}
        aria-label="Requisiciones"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition",
          mode === "requisiciones"
            ? "bg-[#2563eb] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onModeChange("correo")}
        aria-label="Observaciones"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition",
          mode === "correo"
            ? "bg-[#2563eb] text-white shadow-sm"
            : "bg-[#dbeafe] text-slate-600 hover:bg-[#cfe0fc]",
        )}
      >
        <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
