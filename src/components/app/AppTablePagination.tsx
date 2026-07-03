type AppTablePaginationProps = {
  shownCount: number;
  totalCount: number;
};

export function AppTablePagination({ shownCount, totalCount }: AppTablePaginationProps) {
  if (totalCount === 0) {
    return (
      <div className="app-pagination-bar border-t border-slate-100 px-4 py-2.5">
        <p>Sin registros</p>
      </div>
    );
  }

  return (
    <div className="app-pagination-bar border-t border-slate-100 px-4 py-2.5">
      <p>
        Mostrando 1 a {shownCount.toLocaleString("es-PE")} de{" "}
        {totalCount.toLocaleString("es-PE")} registros
      </p>
    </div>
  );
}
