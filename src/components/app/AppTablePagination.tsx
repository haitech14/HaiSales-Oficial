type AppTablePaginationProps = {
  shownCount: number;
  totalCount: number;
  filteredCount?: number;
};

export function AppTablePagination({
  shownCount,
  totalCount,
  filteredCount,
}: AppTablePaginationProps) {
  if (totalCount === 0) {
    return (
      <div className="app-pagination-bar border-t border-slate-100 px-4 py-2.5">
        <p>Sin registros</p>
      </div>
    );
  }

  const isFiltered =
    typeof filteredCount === "number" && filteredCount !== totalCount;

  if (shownCount === 0) {
    return (
      <div className="app-pagination-bar border-t border-slate-100 px-4 py-2.5">
        <p>
          Sin resultados para los filtros aplicados
          {isFiltered ? ` · ${totalCount.toLocaleString("es-PE")} en total` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="app-pagination-bar border-t border-slate-100 px-4 py-2.5">
      <p>
        Mostrando 1 a {shownCount.toLocaleString("es-PE")} de{" "}
        {(isFiltered ? filteredCount! : totalCount).toLocaleString("es-PE")} registros
        {isFiltered ? ` (${totalCount.toLocaleString("es-PE")} en total)` : ""}
      </p>
    </div>
  );
}
