import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { cn } from "@/lib/utils";

type AppPeriodFilterProps = {
  className?: string;
  size?: "sm" | "default";
};

export function AppPeriodFilter({ className, size = "sm" }: AppPeriodFilterProps) {
  const { preset, range, setPreset, options } = useAppPeriod();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("h-9 gap-2 border-slate-200 text-slate-600", className)}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden font-medium md:inline">{range.label}</span>
          <span className="font-medium md:hidden">{range.shortLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Periodo de análisis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setPreset(option.id)}
            className={cn(preset === option.id && "bg-blue-50 text-blue-700")}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
