import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  options?: AutocompleteOption[];
  loadOptions?: (query: string) => Promise<AutocompleteOption[]>;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  onAdd?: () => void;
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
  options = [],
  loadOptions,
  onChange,
  onSelect,
  onAdd,
  maxResults = 12,
  debounceMs = 220,
  emptyMessage = "Sin resultados",
}: SearchableAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });
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

  const updateDropdownPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const handleReposition = () => updateDropdownPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateDropdownPosition, value, filteredOptions.length, isLoading]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Radix Dialog (RemoveScroll) bloquea wheel fuera del content; el portal
  // queda fuera, así que reactivamos el scroll del listado en captura.
  useEffect(() => {
    if (!open) return;

    const onWheel = (event: WheelEvent) => {
      const list = dropdownRef.current;
      if (!list) return;
      const target = event.target as Node | null;
      if (!target || !list.contains(target)) return;

      event.stopPropagation();

      const maxScroll = list.scrollHeight - list.clientHeight;
      if (maxScroll <= 0) return;

      const next = Math.min(maxScroll, Math.max(0, list.scrollTop + event.deltaY));
      if (next === list.scrollTop) return;

      list.scrollTop = next;
      event.preventDefault();
    };

    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, [open, filteredOptions.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, filteredOptions.length]);

  const selectOption = (option: AutocompleteOption) => {
    onChange(option.value);
    onSelect?.(option);
    setOpen(false);
  };

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

  return (
    <div ref={containerRef} className="flex gap-1.5">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
        />
        {showDropdown &&
          createPortal(
            <div
              ref={dropdownRef}
              id={listId}
              role="listbox"
              style={{
                position: "fixed",
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                zIndex: 9999,
              }}
              className="max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-lg [scrollbar-gutter:stable]"
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
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectOption(option)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition",
                          index === activeIndex ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50",
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
            </div>,
            document.body,
          )}
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Agregar"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
