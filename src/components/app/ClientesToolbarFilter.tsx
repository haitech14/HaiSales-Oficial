import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ClientesToolbarFilterProps = {
  label: string;
  value: string;
  options: string[];
  allLabel?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ClientesToolbarFilter({
  label,
  value,
  options,
  allLabel = "Todos",
  onChange,
  className,
}: ClientesToolbarFilterProps) {
  const isActive = value !== "todos";
  const displayValue = isActive ? value : allLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs border-slate-200 text-slate-600 hover:border-emerald-600 hover:bg-[#43a047] hover:text-white",
            isActive && "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
            className,
          )}
        >
          {label}: {displayValue}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 min-w-[12rem] overflow-y-auto p-1 shadow-lg">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onChange("todos")}
          className={cn(
            "cursor-pointer rounded-md text-xs",
            !isActive && "text-slate-700",
            !isActive && "hover:bg-slate-50",
            isActive && "bg-blue-50 font-semibold text-blue-700",
          )}
        >
          {allLabel}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              "cursor-pointer rounded-md text-xs",
              value === option && "bg-blue-50 font-semibold text-blue-700",
            )}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
