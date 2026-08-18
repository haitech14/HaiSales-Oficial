import { Radio, Tags } from "lucide-react";
import { CRM_FUENTE_FILTERS, CRM_TIPO_CLIENTE_FILTERS } from "@/lib/crm/crm-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterOption = { id: string; label: string };

type CrmTipoClienteFilterProps = {
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
  fuenteValue?: string;
  onFuenteChange?: (value: string) => void;
  fuenteCounts?: Record<string, number>;
  className?: string;
};

function CompactFilterSelect({
  label,
  ariaLabel,
  icon: Icon,
  value,
  onChange,
  options,
  counts,
}: {
  label: string;
  ariaLabel: string;
  icon: typeof Tags;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  counts?: Record<string, number>;
}) {
  const selected = options.find((option) => option.id === value) ?? options[0];
  const selectedCount = counts?.[selected.id];

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={ariaLabel}
          className="h-8 w-[168px] gap-2 rounded-lg border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-none focus:ring-blue-600/20"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate text-left">
            <SelectValue placeholder={label}>{selected.label}</SelectValue>
            {typeof selectedCount === "number" ? (
              <span className="ml-1 font-semibold text-slate-400">{selectedCount}</span>
            ) : null}
          </span>
        </SelectTrigger>
        <SelectContent align="start" className="w-[220px]">
          {options.map((option) => {
            const count = counts?.[option.id];
            return (
              <SelectItem key={option.id} value={option.id} className="text-xs font-semibold">
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{option.label}</span>
                  {typeof count === "number" ? (
                    <span className="tabular-nums font-semibold text-slate-400">{count}</span>
                  ) : null}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CrmTipoClienteFilter({
  value,
  onChange,
  counts,
  fuenteValue = "todas",
  onFuenteChange,
  fuenteCounts,
  className,
}: CrmTipoClienteFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <CompactFilterSelect
        label="Categoría"
        ariaLabel="Categoría"
        icon={Tags}
        value={value}
        onChange={onChange}
        options={CRM_TIPO_CLIENTE_FILTERS}
        counts={counts}
      />
      {onFuenteChange ? (
        <CompactFilterSelect
          label="Fuente"
          ariaLabel="Fuente"
          icon={Radio}
          value={fuenteValue}
          onChange={onFuenteChange}
          options={CRM_FUENTE_FILTERS}
          counts={fuenteCounts}
        />
      ) : null}
    </div>
  );
}
