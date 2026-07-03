import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClienteColumnKey, ClienteSortDirection } from "@/hooks/useClientes";

type ClientesTableHeaderProps = {
  label: string;
  columnKey: ClienteColumnKey;
  sortField: ClienteColumnKey | null;
  sortDirection: ClienteSortDirection;
  onSort: (field: ClienteColumnKey, direction: ClienteSortDirection) => void;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
  className?: string;
  columnMinWidth?: string;
};

export function ClientesTableHeader({
  label,
  columnKey,
  sortField,
  sortDirection,
  onSort,
  filterValue = "todos",
  filterOptions,
  onFilterChange,
  className,
  columnMinWidth = "min-w-[110px]",
}: ClientesTableHeaderProps) {
  const isSorted = sortField === columnKey && sortDirection !== null;
  const isFilterActive = filterValue !== "todos";
  const isActive = isSorted || isFilterActive;
  const hasFilter = Boolean(filterOptions && onFilterChange);

  const handleSort = (direction: ClienteSortDirection) => {
    if (isSorted && sortDirection === direction) {
      onSort(columnKey, null);
      return;
    }
    onSort(columnKey, direction);
  };

  return (
    <th className={cn("app-table-cell align-bottom py-2", className)}>
      <div className={cn("relative", columnMinWidth)}>
        <div className="group/label relative inline-block max-w-full">
          <span
            className={cn(
              "inline-flex cursor-default items-center gap-1 rounded px-0.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              "group-hover/label:bg-slate-100",
              isActive ? "text-blue-700" : "text-slate-600",
            )}
          >
            {label}
            {isSorted && (
              <span className="text-blue-600" aria-hidden>
                {sortDirection === "asc" ? (
                  <ArrowUpAZ className="h-3 w-3" />
                ) : (
                  <ArrowDownAZ className="h-3 w-3" />
                )}
              </span>
            )}
            {isFilterActive && <Filter className="h-3 w-3 text-blue-600" aria-hidden />}
          </span>

          <div
            className={cn(
              "absolute left-0 top-full z-30 pt-1",
              "pointer-events-none invisible opacity-0 transition-opacity duration-150",
              "group-hover/label:pointer-events-auto group-hover/label:visible group-hover/label:opacity-100",
              "group-focus-within/label:pointer-events-auto group-focus-within/label:visible group-focus-within/label:opacity-100",
            )}
          >
            <div className="min-w-[148px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleSort("asc")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded border text-slate-500 hover:bg-slate-50",
                    isSorted && sortDirection === "asc"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200",
                  )}
                  title="Ordenar A → Z"
                  aria-label={`Ordenar ${label} ascendente`}
                >
                  <ArrowUpAZ className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("desc")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded border text-slate-500 hover:bg-slate-50",
                    isSorted && sortDirection === "desc"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200",
                  )}
                  title="Ordenar Z → A"
                  aria-label={`Ordenar ${label} descendente`}
                >
                  <ArrowDownAZ className="h-3 w-3" />
                </button>
                {isSorted && (
                  <button
                    type="button"
                    onClick={() => onSort(columnKey, null)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"
                    title="Quitar orden"
                    aria-label={`Quitar orden de ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {hasFilter && (
                <div className="relative mt-1">
                  <select
                    value={filterValue}
                    onChange={(event) => onFilterChange?.(event.target.value)}
                    className={cn(
                      "h-7 w-full appearance-none rounded-md border bg-white pl-2 pr-7 text-[11px] font-medium text-slate-700",
                      isFilterActive ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200",
                    )}
                    aria-label={`Filtrar por ${label}`}
                  >
                    <option value="todos">Todos</option>
                    {filterOptions!.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </th>
  );
}
