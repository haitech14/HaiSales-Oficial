import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateProductoInput } from "@/lib/inventario/producto-form-data";
import {
  downloadProductoPlantilla,
  parseProductosCsv,
  type ParsedProductoImportRow,
} from "@/lib/inventario/producto-import";
import { cn } from "@/lib/utils";

type ImportProductosModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: CreateProductoInput[]) => Promise<void>;
  isImporting?: boolean;
};

export function ImportProductosModal({
  open,
  onOpenChange,
  onImport,
  isImporting,
}: ImportProductosModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductoImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const resetState = () => {
    setFileName(null);
    setParsedRows([]);
    setParseErrors([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Solo se admiten archivos CSV");
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const result = await parseProductosCsv(file);
      setParsedRows(result.rows);
      setParseErrors(result.errors);

      if (result.rows.length === 0 && result.errors.length === 0) {
        toast.error("No se encontraron filas válidas en el archivo");
      }
    } catch {
      toast.error("No se pudo leer el archivo CSV");
      resetState();
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("Selecciona un archivo con productos válidos");
      return;
    }

    if (parseErrors.length > 0) {
      toast.error("Corrige los errores del archivo antes de importar");
      return;
    }

    try {
      await onImport(parsedRows.map((row) => row.input));
      toast.success(`${parsedRows.length} producto(s) importado(s) correctamente`);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo importar el archivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Importar productos</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                Carga varios productos desde un archivo CSV usando la plantilla de HaiSales.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition",
              fileName ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-slate-50/60 hover:border-blue-200 hover:bg-blue-50/30",
            )}
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Upload className="h-5 w-5 text-blue-600" />
            </span>
            <p className="text-sm font-semibold text-slate-800">
              {fileName ? fileName : "Arrastra o selecciona un archivo CSV"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Formato compatible con Excel y Google Sheets</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
          />

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Plantilla CSV</p>
                <p className="text-xs text-slate-500">Descarga el formato con columnas y un ejemplo</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-slate-200"
              onClick={downloadProductoPlantilla}
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>

          {(parsedRows.length > 0 || parseErrors.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              {parsedRows.length > 0 && (
                <p className="font-medium text-slate-800">
                  {parsedRows.length} producto(s) listo(s) para importar
                </p>
              )}
              {parseErrors.length > 0 && (
                <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-red-600">
                  {parseErrors.slice(0, 8).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                  {parseErrors.length > 8 && (
                    <li>… y {parseErrors.length - 8} error(es) más</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="gap-2 bg-blue-600 hover:bg-blue-500"
            onClick={() => void handleImport()}
            disabled={isImporting || isParsing || parsedRows.length === 0 || parseErrors.length > 0}
          >
            <Upload className="h-4 w-4" />
            Importar productos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
