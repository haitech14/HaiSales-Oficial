import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientesColumnFilterProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
};

export function ClientesColumnFilter({
  label,
  value,
  options,
  onChange,
  className,
}: ClientesColumnFilterProps) {
  const isActive = value !== "todos";

  return (
    <th className={cn("app-table-cell", className)}>
      <div className="flex min-w-[120px] flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</span>
        <div className="relative">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              "h-8 w-full appearance-none rounded-md border bg-white pl-2 pr-7 text-xs font-medium text-slate-700",
              isActive ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200",
            )}
            aria-label={`Filtrar por ${label}`}
          >
            <option value="todos">Todos</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </th>
  );
}
