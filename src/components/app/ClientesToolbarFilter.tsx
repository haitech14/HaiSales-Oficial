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
            "h-9 gap-2 border-slate-200 text-slate-600",
            isActive && "border-blue-300 bg-blue-50 text-blue-700",
            className,
          )}
        >
          {label}: {displayValue}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onChange("todos")}
          className={cn(!isActive && "bg-blue-50 text-blue-700")}
        >
          {allLabel}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={cn(value === option && "bg-blue-50 text-blue-700")}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
