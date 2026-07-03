import { EMPRESA_MONEDA_OPTIONS } from "@/lib/parametros/empresa-config-data";
import { cn } from "@/lib/utils";

type CurrencyMultiSelectProps = {
  value: string[];
  onChange: (monedas: string[]) => void;
  className?: string;
};

export function CurrencyMultiSelect({ value, onChange, className }: CurrencyMultiSelectProps) {
  const toggle = (code: string) => {
    if (value.includes(code)) {
      const next = value.filter((item) => item !== code);
      onChange(next.length > 0 ? next : ["PEN"]);
      return;
    }
    onChange([...value, code]);
  };

  return (
    <div className={cn("space-y-2 rounded-[10px] bg-[#eef2f8] p-3", className)}>
      {EMPRESA_MONEDA_OPTIONS.map((option) => {
        const checked = value.includes(option.code);
        return (
          <label
            key={option.code}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-slate-800 hover:bg-white/60"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option.code)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/25"
            />
            <span className={checked ? "font-medium" : ""}>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
