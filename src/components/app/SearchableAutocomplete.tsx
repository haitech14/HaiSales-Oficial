import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type AutocompleteOption = {
  value: string;
  label: string;
  hint?: string;
  searchText?: string;
  meta?: Record<string, string | number | null | undefined>;
};

type SearchableAutocompleteProps = {
  placeholder: string;
  value: string;
  selectedDisplay?: string;
  options?: AutocompleteOption[];
  loadOptions?: (query: string) => Promise<AutocompleteOption[]>;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  onAdd?: () => void;
  variant?: "default" | "plain";
  maxResults?: number;
  debounceMs?: number;
  emptyMessage?: string;
};

function normalizeQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesOption(option: AutocompleteOption, query: string) {
  if (!query) return true;
  const haystack = normalizeQuery(`${option.label} ${option.hint ?? ""} ${option.searchText ?? ""}`);
  return haystack.includes(query);
}

export function SearchableAutocomplete({
  placeholder,
  value,
  selectedDisplay,
  options = [],
  loadOptions,
  onChange,
  onSelect,
  onAdd,
  variant = "default",
  maxResults = 12,
  debounceMs = 220,
  emptyMessage = "Sin resultados",
}: SearchableAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const selectingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteOptions, setRemoteOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const localFiltered = useMemo(() => {
    const query = normalizeQuery(value);
    return options.filter((option) => matchesOption(option, query)).slice(0, maxResults);
  }, [maxResults, options, value]);

  const filteredOptions = loadOptions ? remoteOptions.slice(0, maxResults) : localFiltered;

  useEffect(() => {
    if (!loadOptions) {
      setRemoteOptions([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void loadOptions(value)
        .then((next) => {
          if (requestId !== requestIdRef.current) return;
          setRemoteOptions(next);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setRemoteOptions([]);
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          setIsLoading(false);
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, loadOptions, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (selectingRef.current) return;
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, filteredOptions.length]);

  const selectOption = useCallback(
    (option: AutocompleteOption) => {
      selectingRef.current = true;
      onSelect?.(option);
      onChange("");
      setOpen(false);
      window.setTimeout(() => {
        selectingRef.current = false;
        inputRef.current?.blur();
      }, 0);
    },
    [onChange, onSelect],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (!open || filteredOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % filteredOptions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + filteredOptions.length) % filteredOptions.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) selectOption(option);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && (isLoading || filteredOptions.length > 0 || Boolean(loadOptions));
  const displayValue = value || selectedDisplay || "";
  const showingSelection = !value && Boolean(selectedDisplay);
  const isPlain = variant === "plain";

  return (
    <div ref={containerRef} className={cn("flex w-full", isPlain ? "gap-1" : "gap-1.5")}>
      <div className="relative z-30 min-w-0 flex-1">
        {isPlain ? null : (
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (showingSelection) {
              window.requestAnimationFrame(() => inputRef.current?.select());
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-9 w-full bg-transparent text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none",
            isPlain
              ? "border-0 px-0 focus:ring-0"
              : cn(
                  "rounded-lg border pl-8 pr-3 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-600/10",
                  showingSelection
                    ? "border-slate-200 font-medium"
                    : "border-slate-200",
                ),
          )}
        />
        {showDropdown && (
          <div
            ref={dropdownRef}
            id={listId}
            role="listbox"
            data-haisales-portal="autocomplete"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-xl [scrollbar-gutter:stable]"
          >
            {isLoading && filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">Buscando…</p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">{emptyMessage}</p>
            ) : (
              <ul>
                {filteredOptions.map((option, index) => (
                  <li key={`${option.meta?.id ?? option.value}-${index}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => {
                        // mousedown (antes del blur/click) — evita que el Dialog robe el gesto
                        event.preventDefault();
                        event.stopPropagation();
                        selectOption(option);
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition",
                        index === activeIndex
                          ? "bg-blue-50 text-blue-900"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span className="font-medium">{option.label}</span>
                      {option.hint && (
                        <span className="text-xs text-slate-500">{option.hint}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            "flex shrink-0 items-center justify-center text-slate-500 transition hover:text-slate-700",
            isPlain
              ? "h-8 w-8 rounded-md hover:bg-slate-100"
              : "h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-50",
          )}
          aria-label="Agregar"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
