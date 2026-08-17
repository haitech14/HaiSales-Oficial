import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { formatVentasHeaderDate } from "@/lib/ventas/ventas-page-utils";

type GuiasPageHeaderProps = {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function GuiasPageHeader({
  selectedDate,
  onPreviousDay,
  onNextDay,
  search,
  onSearchChange,
}: GuiasPageHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/80 bg-[#f4f7f9] px-4 pb-4 pt-5 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2rem] font-bold leading-none tracking-tight text-slate-900">Guías</h1>
          <p className="mt-2 text-[15px] font-medium text-slate-500">
            {formatVentasHeaderDate(selectedDate)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-1">
          {searchOpen ? (
            <div className="relative mr-1 w-[min(72vw,240px)]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar guía..."
                className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none ring-blue-500 focus:ring-2"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  onSearchChange("");
                }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onPreviousDay}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Calendario"
          >
            <Calendar className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onNextDay}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {!searchOpen && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
              aria-label="Buscar"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
