import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GuiaConductorSelectProps = {
  value: string;
  options: string[];
  onSave: (value: string) => Promise<void>;
};

export function GuiaConductorSelect({ value, options, onSave }: GuiaConductorSelectProps) {
  const [isSaving, setIsSaving] = useState(false);

  const mergedOptions = [
    ...new Set([
      ...options,
      ...(value && value !== "—" ? [value] : []),
    ]),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const handleChange = async (nextValue: string) => {
    const normalized = nextValue.trim() === "" ? "—" : nextValue;
    if (normalized === value) return;

    setIsSaving(true);
    try {
      await onSave(normalized);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-flex max-w-[168px] items-center">
      <select
        value={value === "—" ? "" : value}
        onChange={(event) => void handleChange(event.target.value)}
        disabled={isSaving}
        title={value}
        className={cn(
          "h-7 w-full max-w-[168px] cursor-pointer appearance-none truncate rounded border border-transparent",
          "bg-transparent py-0 pl-1 pr-5 text-xs text-slate-700",
          "hover:border-slate-200 hover:bg-white",
          "focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100",
        )}
      >
        <option value="">—</option>
        {mergedOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {isSaving ? (
        <Loader2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-blue-500" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      )}
    </div>
  );
}
