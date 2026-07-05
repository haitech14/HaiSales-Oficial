import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Check, Cog, Package, Plus, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutocompleteOption } from "@/components/app/SearchableAutocomplete";
import { cn } from "@/lib/utils";

type ProductMultiPickerProps = {
  placeholder?: string;
  options: AutocompleteOption[];
  onAddSelected: (options: AutocompleteOption[]) => void;
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

function ProductOptionThumb({
  iconKind,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  label,
}: {
  iconKind?: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
}) {
  const Icon =
    iconKind === "service" ? Wrench : iconKind === "kit" ? Box : iconKind === "cog" ? Cog : Package;

  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100",
        iconBg,
      )}
      aria-hidden
    >
      <Icon className={cn("h-4 w-4", iconColor)} />
    </span>
  );
}

export function ProductMultiPicker({
  placeholder = "Buscar por nombre o SKU...",
  options,
  onAddSelected,
  onAdd,
  maxResults = 16,
}: ProductMultiPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const filteredOptions = useMemo(() => {
    const query = normalizeQuery(search);
    return options.filter((option) => matchesOption(option, query)).slice(0, maxResults);
  }, [maxResults, options, search]);

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
  }, [open, updateDropdownPosition, search, selectedValues.size]);

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
  }, [search, filteredOptions.length]);

  const toggleOption = (option: AutocompleteOption) => {
    setSelectedValues((current) => {
      const next = new Set(current);
      if (next.has(option.value)) {
        next.delete(option.value);
      } else {
        next.add(option.value);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    const selected = options.filter((option) => selectedValues.has(option.value));
    if (selected.length === 0) return;
    onAddSelected(selected);
    setSelectedValues(new Set());
    setSearch("");
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
      if (option) toggleOption(option);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && filteredOptions.length > 0;
  const selectedCount = selectedValues.size;

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-autocomplete="list"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
          {showDropdown &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: dropdownStyle.top,
                  left: dropdownStyle.left,
                  width: dropdownStyle.width,
                  zIndex: 9999,
                }}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                <ul id={listId} role="listbox" className="max-h-64 overflow-auto py-1">
                  {filteredOptions.map((option, index) => {
                    const isSelected = selectedValues.has(option.value);
                    const iconKind =
                      typeof option.meta?.iconKind === "string" ? option.meta.iconKind : "product";
                    const iconBg =
                      typeof option.meta?.iconBg === "string" ? option.meta.iconBg : "bg-blue-50";
                    const iconColor =
                      typeof option.meta?.iconColor === "string" ? option.meta.iconColor : "text-blue-600";

                    return (
                      <li key={`${option.value}-${index}`} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => toggleOption(option)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                            index === activeIndex ? "bg-blue-50" : "hover:bg-slate-50",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <ProductOptionThumb
                            iconKind={iconKind}
                            iconBg={iconBg}
                            iconColor={iconColor}
                            label={option.label}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-slate-800">{option.label}</span>
                            {option.hint && (
                              <span className="block text-xs text-slate-500">{option.hint}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {selectedCount > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {selectedCount} {selectedCount === 1 ? "producto seleccionado" : "productos seleccionados"}
                  </div>
                )}
              </div>,
              document.body,
            )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Agregar producto"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <Button
        type="button"
        onClick={handleAddSelected}
        disabled={selectedCount === 0}
        className="h-9 w-full gap-1.5 bg-blue-600 font-semibold hover:bg-blue-500 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar {selectedCount > 0 ? `(${selectedCount})` : "seleccionados"}
      </Button>
    </div>
  );
}

export function ProductLineThumb({
  iconKind,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
}: {
  iconKind?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <ProductOptionThumb iconKind={iconKind} iconBg={iconBg} iconColor={iconColor} label="" />
  );
}
