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
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  onAdd?: () => void;
  maxResults?: number;
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
  options,
  onChange,
  onSelect,
  onAdd,
  maxResults = 12,
}: SearchableAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const filteredOptions = useMemo(() => {
    const query = normalizeQuery(value);
    return options.filter((option) => matchesOption(option, query)).slice(0, maxResults);
  }, [maxResults, options, value]);

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
  }, [open, updateDropdownPosition, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

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

  const showDropdown = open && filteredOptions.length > 0;

  return (
    <div ref={containerRef} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
        {showDropdown &&
          createPortal(
            <ul
              id={listId}
              role="listbox"
              style={{
                position: "fixed",
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                zIndex: 9999,
              }}
              className="max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {filteredOptions.map((option, index) => (
                <li key={`${option.value}-${index}`} role="presentation">
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
            </ul>,
            document.body,
          )}
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
