import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Box, Check, Cog, Package, Plus, Search, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutocompleteOption } from "@/components/app/SearchableAutocomplete";
import { cn } from "@/lib/utils";

type ProductMultiPickerProps = {
  placeholder?: string;
  options?: AutocompleteOption[];
  /** Búsqueda remota (p. ej. haitech.pe / soporte.haitech.pe). */
  loadOptions?: (query: string) => Promise<AutocompleteOption[]>;
  onAddSelected: (options: AutocompleteOption[]) => void;
  onAdd?: () => void;
  /** Texto del botón + a la derecha del buscador (ej. "Agregar producto"). */
  addButtonLabel?: string;
  /** Oculta el botón inferior "Agregar seleccionados al carrito". */
  hideFooterAddButton?: boolean;
  maxResults?: number;
  debounceMs?: number;
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

function metaNumber(meta: AutocompleteOption["meta"], key: string): number | null {
  const raw = meta?.[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function ProductOptionThumb({
  iconKind,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  imageUrl,
  label,
}: {
  iconKind?: string;
  iconBg?: string;
  iconColor?: string;
  imageUrl?: string | null;
  label: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon =
    iconKind === "service" ? Wrench : iconKind === "kit" ? Box : iconKind === "cog" ? Cog : Package;

  if (imageUrl && !imgFailed) {
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white"
        aria-hidden
      >
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100",
        iconBg,
      )}
      aria-hidden
      title={label}
    >
      <Icon className={cn("h-4 w-4", iconColor)} />
    </span>
  );
}

export function ProductMultiPicker({
  placeholder = "Buscar por nombre o SKU...",
  options = [],
  loadOptions,
  onAddSelected,
  onAdd,
  addButtonLabel,
  hideFooterAddButton = false,
  maxResults = 16,
  debounceMs = 160,
}: ProductMultiPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [selectedMap, setSelectedMap] = useState<Map<string, AutocompleteOption>>(new Map());
  const [remoteOptions, setRemoteOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const localFiltered = useMemo(() => {
    const query = normalizeQuery(search);
    return options.filter((option) => matchesOption(option, query)).slice(0, maxResults);
  }, [maxResults, options, search]);

  const filteredOptions = loadOptions ? remoteOptions.slice(0, maxResults) : localFiltered;
  const selectedList = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedCount = selectedValues.size;

  useEffect(() => {
    if (!loadOptions) {
      setRemoteOptions([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    const trimmed = search.trim();
    // No consultar en cada letra suelta (1 char) — evita spam de red
    if (trimmed.length === 1) {
      setIsLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError(null);
      void loadOptions(search)
        .then((next) => {
          if (requestId !== requestIdRef.current) return;
          setRemoteOptions(next);
        })
        .catch((error) => {
          if (requestId !== requestIdRef.current) return;
          setRemoteOptions([]);
          setLoadError(error instanceof Error ? error.message : "No se pudo cargar el catálogo");
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          setIsLoading(false);
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, loadOptions, search]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
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
  }, [search, filteredOptions.length]);

  const toggleOption = (option: AutocompleteOption) => {
    const key = option.value;
    setSelectedValues((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSelectedMap((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else next.set(key, option);
      return next;
    });
    setOpen(true);
  };

  const removeSelected = (key: string) => {
    setSelectedValues((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setSelectedMap((current) => {
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  };

  const handleAddSelected = () => {
    const selected = Array.from(selectedMap.values());
    if (selected.length === 0) return;
    onAddSelected(selected);
    setSelectedValues(new Set());
    setSelectedMap(new Map());
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

  const showDropdown = open && (filteredOptions.length > 0 || isLoading || Boolean(loadError) || selectedCount > 0);

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex gap-1.5">
        <div className="relative z-30 min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              data-haisales-portal="autocomplete"
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
            >
              {isLoading && (
                <p className="px-3 py-2.5 text-xs text-slate-400">Buscando en Haitech…</p>
              )}
              {!isLoading && loadError && (
                <p className="px-3 py-2.5 text-xs text-red-500">{loadError}</p>
              )}
              {!isLoading && !loadError && filteredOptions.length === 0 && (
                <p className="px-3 py-2.5 text-xs text-slate-400">Sin resultados</p>
              )}
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-multiselectable="true"
                className="max-h-64 overflow-y-auto overscroll-contain py-1 [scrollbar-gutter:stable]"
              >
                {filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.has(option.value);
                  const iconKind =
                    typeof option.meta?.iconKind === "string" ? option.meta.iconKind : "product";
                  const iconBg =
                    typeof option.meta?.iconBg === "string" ? option.meta.iconBg : "bg-blue-50";
                  const iconColor =
                    typeof option.meta?.iconColor === "string"
                      ? option.meta.iconColor
                      : "text-blue-600";
                  const imageUrl =
                    typeof option.meta?.imageUrl === "string" && option.meta.imageUrl
                      ? option.meta.imageUrl
                      : null;
                  const codigo =
                    typeof option.meta?.codigo === "string" ? option.meta.codigo : null;
                  const brand =
                    typeof option.meta?.brand === "string" && option.meta.brand
                      ? option.meta.brand
                      : null;
                  const stock = metaNumber(option.meta, "stock");
                  const precioPen =
                    metaNumber(option.meta, "precioPen") ?? metaNumber(option.meta, "precio");
                  const precioUsd = metaNumber(option.meta, "precioUsd");

                  return (
                    <li key={option.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleOption(option);
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                          index === activeIndex ? "bg-blue-50" : "hover:bg-slate-50",
                          isSelected && "bg-blue-50/70",
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
                          imageUrl={imageUrl}
                          label={option.label}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-800">{option.label}</span>
                          <span className="mt-0.5 flex items-start justify-between gap-3 text-xs text-slate-500">
                            <span className="min-w-0 truncate">
                              {[codigo, brand, stock != null ? `Stock ${stock}` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            {(precioPen != null || precioUsd != null) && (
                              <span className="shrink-0 text-right font-medium tabular-nums text-slate-700">
                                {precioPen != null && (
                                  <span className="block">S/ {precioPen.toFixed(2)}</span>
                                )}
                                {precioUsd != null && precioUsd > 0 && (
                                  <span className="block text-[11px] font-normal text-slate-500">
                                    $ {precioUsd.toFixed(2)}
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selectedCount > 0 && (
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">
                    {selectedCount}{" "}
                    {selectedCount === 1 ? "producto seleccionado" : "productos seleccionados"}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleAddSelected();
                    }}
                    className="h-7 gap-1 bg-slate-900 px-2.5 text-[11px] text-white hover:bg-slate-800"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar ({selectedCount})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50",
              addButtonLabel ? "px-3 text-xs font-medium" : "w-9 text-blue-600",
            )}
            aria-label={addButtonLabel || "Agregar producto"}
          >
            <Plus className="h-3.5 w-3.5" />
            {addButtonLabel ? <span>{addButtonLabel}</span> : null}
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedList.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => removeSelected(option.value)}
                className="shrink-0 rounded text-slate-400 transition hover:text-slate-700"
                aria-label={`Quitar ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!hideFooterAddButton && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddSelected}
          disabled={selectedCount === 0}
          className="h-8 w-full gap-1.5 border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar {selectedCount > 0 ? `(${selectedCount})` : "seleccionados"} al carrito
        </Button>
      )}
    </div>
  );
}

export function ProductLineThumb({
  iconKind,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  imageUrl,
}: {
  iconKind?: string;
  iconBg?: string;
  iconColor?: string;
  imageUrl?: string | null;
}) {
  return (
    <ProductOptionThumb
      iconKind={iconKind}
      iconBg={iconBg}
      iconColor={iconColor}
      imageUrl={imageUrl}
      label=""
    />
  );
}
