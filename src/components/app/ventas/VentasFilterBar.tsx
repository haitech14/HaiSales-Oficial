import type { ComponentType } from "react";
import { FileClock } from "lucide-react";
import { DocumentSearchIcon } from "@/components/app/icons/DocumentSearchIcon";
import type { VentasFilterMode } from "@/lib/ventas/ventas-page-utils";
import { cn } from "@/lib/utils";

type VentasFilterBarProps = {
  mode: VentasFilterMode;
  onModeChange: (mode: VentasFilterMode) => void;
  className?: string;
};

function ComprobantesIcon({ className }: { className?: string }) {
  return <DocumentSearchIcon className={cn("h-[18px] w-[18px]", className)} />;
}

function NotaVentaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M2.5 7.5h2M2.5 12h2M2.5 16.5h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="7.5"
        y="4.5"
        width="12"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.5 9h6M10.5 12h6M10.5 15h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProformasIcon({ className }: { className?: string }) {
  return <FileClock className={className} strokeWidth={2} />;
}

const VENTAS_FILTERS: Array<{
  id: VentasFilterMode;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: "comprobantes", label: "Comprobantes", Icon: ComprobantesIcon },
  { id: "nota-venta", label: "Nota de venta", Icon: NotaVentaIcon },
  { id: "proformas", label: "Proformas", Icon: ProformasIcon },
];

export function VentasFilterBar({ mode, onModeChange, className }: VentasFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {VENTAS_FILTERS.map(({ id, label, Icon }) => {
        const active = mode === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full py-2 text-xs font-semibold transition sm:text-sm",
              active ? "gap-2 bg-[#8cc63f] pl-3 pr-4 text-white shadow-sm" : "bg-[#d1d5db] px-4 text-slate-600 hover:bg-[#c4c9d0]",
            )}
          >
            {active ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}
