import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatDay(date: Date) {
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type ClientesDateRangeFilterProps = {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
};

export function ClientesDateRangeFilter({ from, to, onChange }: ClientesDateRangeFilterProps) {
  const isActive = Boolean(from || to);
  const selected: DateRange | undefined = from || to ? { from: from ?? undefined, to: to ?? undefined } : undefined;
  const label =
    from && to
      ? `${formatDay(from)} – ${formatDay(to)}`
      : from
        ? `Desde ${formatDay(from)}`
        : "Rango de fechas";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs border-slate-200 text-slate-600 hover:border-emerald-600 hover:bg-[#43a047] hover:text-white",
            isActive && "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={selected}
          onSelect={(range) => onChange(range?.from ?? null, range?.to ?? null)}
          defaultMonth={from ?? undefined}
        />
        {isActive ? (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="mt-2 w-full rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Limpiar fechas
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
