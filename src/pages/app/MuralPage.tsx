import { useEffect, useState } from "react";
import { MuralApuntesEditor } from "@/components/app/mural/MuralApuntesEditor";
import { MuralApuntesHeader } from "@/components/app/mural/MuralApuntesHeader";
import {
  loadMuralApuntesBoard,
  saveHomeBoard,
  type WikiKanbanColumn,
} from "@/lib/anuncios/wiki-store";

function boardMatchesSearch(columns: WikiKanbanColumn[], query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return columns.some((column) =>
    column.cards.some(
      (card) =>
        card.title.toLowerCase().includes(normalized) ||
        (card.note ?? "").toLowerCase().includes(normalized),
    ),
  );
}

export default function MuralPage() {
  const [columns, setColumns] = useState<WikiKanbanColumn[]>(() => loadMuralApuntesBoard());
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveHomeBoard(columns);
  }, [columns]);

  const hasSearchResults = boardMatchesSearch(columns, search);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#eef1f5]">
      <MuralApuntesHeader search={search} onSearchChange={setSearch} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!hasSearchResults && search.trim() ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
            No hay apuntes que coincidan con «{search.trim()}».
          </div>
        ) : (
          <MuralApuntesEditor columns={columns} onChange={setColumns} className="flex-1" />
        )}
      </div>
    </div>
  );
}
