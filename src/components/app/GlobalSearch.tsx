import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  FileText,
  LayoutGrid,
  Loader2,
  Package,
  Search,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  GLOBAL_SEARCH_CATEGORY_LABELS,
  type GlobalSearchCategory,
  type GlobalSearchResult,
} from "@/lib/global-search/global-search-types";
import { groupResultsByCategory, searchGlobally } from "@/lib/global-search/global-search-service";

type GlobalSearchContextValue = {
  openSearch: () => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

const CATEGORY_ICONS: Record<GlobalSearchCategory, typeof Search> = {
  cliente: Building2,
  contacto: UserRound,
  comprobante: FileText,
  guia: Truck,
  producto: Package,
  oportunidad: LayoutGrid,
  modulo: Wrench,
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 280);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setIsSearching(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    void searchGlobally(user?.id ?? null, trimmed).then((nextResults) => {
      if (!cancelled) {
        setResults(nextResults);
        setIsSearching(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, user?.id]);

  const groupedResults = useMemo(() => groupResultsByCategory(results), [results]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar cliente, contacto, serie, comprobante, guía, producto..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[min(420px,60vh)]">
        {isSearching && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando en el sistema...
          </div>
        )}

        {!isSearching && debouncedQuery.trim().length < 2 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Escribe al menos 2 caracteres para buscar clientes, contactos, series, comprobantes,
            guías, productos u oportunidades.
          </div>
        )}

        {!isSearching && debouncedQuery.trim().length >= 2 && groupedResults.length === 0 && (
          <CommandEmpty>No se encontraron resultados para &quot;{debouncedQuery}&quot;.</CommandEmpty>
        )}

        {!isSearching &&
          groupedResults.map((group, groupIndex) => (
            <div key={group.category}>
              {groupIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={GLOBAL_SEARCH_CATEGORY_LABELS[group.category]}>
                {group.items.map((result) => {
                  const Icon = CATEGORY_ICONS[result.category];
                  return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.subtitle ?? ""}`}
                      onSelect={() => handleSelect(result.href)}
                      className="gap-3 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">{result.title}</span>
                        {result.subtitle && (
                          <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
      </CommandList>
    </CommandDialog>
  );
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch debe usarse dentro de GlobalSearchProvider");
  }
  return context;
}

type GlobalSearchTriggerProps = {
  className?: string;
  showShortcut?: boolean;
};

export function GlobalSearchTrigger({ className, showShortcut = true }: GlobalSearchTriggerProps) {
  const { openSearch } = useGlobalSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50",
        "w-9 justify-center px-0 sm:w-auto sm:justify-start sm:px-3",
        className,
      )}
      aria-label="Búsqueda general"
      title="Búsqueda general (Ctrl+K)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="hidden text-sm text-slate-400 lg:inline">Buscar...</span>
      {showShortcut && (
        <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
          Ctrl+K
        </kbd>
      )}
    </button>
  );
}

export function GlobalSearchIconButton({ className }: { className?: string }) {
  const { openSearch } = useGlobalSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50",
        className,
      )}
      aria-label="Búsqueda general"
      title="Búsqueda general (Ctrl+K)"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
