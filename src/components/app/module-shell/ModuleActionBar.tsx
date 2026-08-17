import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleActionBarProps = {
  primaryLabel: string;
  primaryIcon: LucideIcon;
  primaryColor?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ModuleActionBar({
  primaryLabel,
  primaryIcon: PrimaryIcon,
  primaryColor = "#8cc63f",
  className,
  children,
}: ModuleActionBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <PrimaryIcon className="h-4 w-4 shrink-0" strokeWidth={2} />
        {primaryLabel}
      </button>
      {children}
    </div>
  );
}
