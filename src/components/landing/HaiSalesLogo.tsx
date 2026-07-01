import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HaiSalesLogoProps {
  variant?: "light" | "dark";
  href?: string;
  className?: string;
}

export function HaiSalesLogo({ variant = "light", href = "#inicio", className }: HaiSalesLogoProps) {
  return (
    <a href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
        <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "text-xl font-bold tracking-tight",
          variant === "light" ? "text-white" : "text-slate-900",
        )}
      >
        HaiSales
      </span>
    </a>
  );
}
