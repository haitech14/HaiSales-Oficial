import { Plus, Trash2 } from "lucide-react";
import { WikiWhatsAppInput } from "@/components/app/anuncios/WikiWhatsAppTextarea";
import { Button } from "@/components/ui/button";
import type { WikiPage } from "@/lib/anuncios/wiki-store";

type AnunciosWikiTableViewProps = {
  table: WikiPage["table"];
  onChange: (table: WikiPage["table"]) => void;
};

export function AnunciosWikiTableView({ table, onChange }: AnunciosWikiTableViewProps) {
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const rows = table.rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
    );
    onChange({ ...table, rows });
  };

  const addRow = () => {
    onChange({
      ...table,
      rows: [...table.rows, table.columns.map(() => "")],
    });
  };

  const addColumn = () => {
    onChange({
      columns: [...table.columns, `Columna ${table.columns.length + 1}`],
      rows: table.rows.map((row) => [...row, ""]),
    });
  };

  const removeRow = (rowIndex: number) => {
    onChange({
      ...table,
      rows: table.rows.filter((_, index) => index !== rowIndex),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Tabla</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addColumn}>
            <Plus className="h-3.5 w-3.5" />
            Columna
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Fila
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              {table.columns.map((column, colIndex) => (
                <th key={`col-${colIndex}`} className="border-b border-slate-200 px-3 py-2 text-left">
                  <WikiWhatsAppInput
                    value={column}
                    onChange={(value) => {
                      const columns = table.columns.map((item, index) =>
                        index === colIndex ? value : item,
                      );
                      onChange({ ...table, columns });
                    }}
                    inputClassName="font-semibold text-slate-700"
                  />
                </th>
              ))}
              <th className="w-10 border-b border-slate-200" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-slate-50/80">
                {row.map((cell, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="border-b border-slate-100 px-3 py-1.5">
                    <WikiWhatsAppInput
                      value={cell}
                      onChange={(value) => updateCell(rowIndex, colIndex, value)}
                      inputClassName="text-slate-700"
                    />
                  </td>
                ))}
                <td className="border-b border-slate-100 px-1">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
