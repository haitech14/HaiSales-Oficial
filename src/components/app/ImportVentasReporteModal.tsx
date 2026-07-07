import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  groupRowsByDocumentType,
  groupRowsByPeriod,
  loadVentaReporteLegacyBundle,
  parseVentaReporteFile,
  parseVentaReporteUrl,
  VENTAS_REPORTE_LEGACY_FILES,
  type VentaReporteParseResult,
  type VentaReporteRow,
} from "@/lib/ventas/venta-report-import";
import type { VentaImportSummary } from "@/lib/ventas/ventas-import-service";
import { cn } from "@/lib/utils";

type ImportVentasReporteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: VentaReporteRow[]) => Promise<VentaImportSummary>;
  onImportLegacyDb?: () => Promise<number>;
  isImporting?: boolean;
  isImportingLegacyDb?: boolean;
};

export function ImportVentasReporteModal({
  open,
  onOpenChange,
  onImport,
  onImportLegacyDb,
  isImporting,
  isImportingLegacyDb,
}: ImportVentasReporteModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsedBatches, setParsedBatches] = useState<VentaReporteParseResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [loadingLegacy, setLoadingLegacy] = useState(false);

  const allRows = parsedBatches.flatMap((batch) => batch.rows);
  const allErrors = parsedBatches.flatMap((batch) => batch.errors);
  const anulados = allRows.filter((row) => row.anulada).length;

  const resetState = () => {
    setParsedBatches([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const appendBatch = (batch: VentaReporteParseResult) => {
    setParsedBatches((current) => {
      const withoutDuplicate = current.filter((item) => item.meta.archivo !== batch.meta.archivo);
      return [...withoutDuplicate, batch];
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsParsing(true);

    try {
      const results = await Promise.all([...files].map((file) => parseVentaReporteFile(file)));
      for (const result of results) {
        appendBatch(result);
      }
      const total = results.reduce((sum, result) => sum + result.rows.length, 0);
      if (total === 0) {
        toast.error("No se encontraron comprobantes válidos en los archivos seleccionados");
      } else {
        toast.success(`${total} comprobantes listos para importar`);
      }
    } catch {
      toast.error("No se pudo leer uno o más archivos XLSX");
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadLegacyReports = async () => {
    setLoadingLegacy(true);
    try {
      const bundle = await loadVentaReporteLegacyBundle();
      setParsedBatches([bundle]);
      toast.success(`${bundle.rows.length} comprobantes cargados desde bundle histórico`);
    } catch {
      try {
        const results = await Promise.all(
          VENTAS_REPORTE_LEGACY_FILES.map((file) => parseVentaReporteUrl(file.path, file.label)),
        );
        setParsedBatches(results);
        const total = results.reduce((sum, result) => sum + result.rows.length, 0);
        toast.success(`${total} comprobantes cargados desde reportes XLSX`);
      } catch {
        toast.error("No se pudieron cargar los reportes históricos del sistema");
      }
    } finally {
      setLoadingLegacy(false);
    }
  };

  const handleImportLegacyDb = async () => {
    if (!onImportLegacyDb) return;
    try {
      const count = await onImportLegacyDb();
      toast.success(`Sincronizados ${count} comprobantes desde la base legacy`);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo sincronizar la base legacy");
    }
  };

  const handleImport = async () => {
    if (!allRows.length) {
      toast.error("Primero carga uno o más reportes de ventas");
      return;
    }

    try {
      const summary = await onImport(allRows);
      toast.success(
        `Importación completada: ${summary.ventasInsertadas} nuevos, ${summary.ventasActualizados} actualizados, ${summary.movimientosTesoreria} movimientos y ${summary.cuentasCobrar} cobranzas`,
      );
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo importar el reporte");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Importar reporte de ventas</DialogTitle>
        <DialogDescription>
          Carga reportes XLSX del sistema legacy (set. 2024 – jun. 2026). Las filas en rojo o con importe S/ 0 se
          registran como comprobantes anulados. También sincroniza cuentas bancarias y movimientos en Caja y Bancos.
        </DialogDescription>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => inputRef.current?.click()}
              disabled={isParsing || isImporting}
            >
              {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Seleccionar XLSX
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => void handleLoadLegacyReports()}
              disabled={loadingLegacy || isImporting}
            >
              {loadingLegacy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Cargar histórico (2024–2026)
            </Button>
            {onImportLegacyDb && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleImportLegacyDb()}
                disabled={isImportingLegacyDb || isImporting}
              >
                {isImportingLegacyDb ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Sincronizar desde BD legacy
              </Button>
            )}
            {parsedBatches.length > 0 && (
              <Button type="button" variant="ghost" className="gap-2" onClick={resetState}>
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />

          {parsedBatches.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">
                {allRows.length} comprobantes · {anulados} anulados · {parsedBatches.length} archivo(s)
              </p>
              <ul className="mt-2 space-y-1 text-slate-600">
                {parsedBatches.map((batch) => (
                  <li key={batch.meta.archivo}>
                    {batch.meta.archivo}: {batch.meta.totalFilas} filas
                    {batch.meta.periodoDesde ? ` · ${batch.meta.periodoDesde} al ${batch.meta.periodoHasta}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allRows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Por mes</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {groupRowsByPeriod(allRows).map(([period, rows]) => (
                    <li key={period} className="flex justify-between gap-2">
                      <span>{period}</span>
                      <span className="font-semibold">{rows.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Por tipo</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {groupRowsByDocumentType(allRows).map(([label, rows]) => (
                    <li key={label} className="flex justify-between gap-2">
                      <span>{label}</span>
                      <span className="font-semibold">{rows.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {allErrors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Advertencias de lectura</p>
              <ul className="mt-1 list-disc pl-4">
                {allErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={!allRows.length || isImporting}
              className={cn(isImporting && "pointer-events-none")}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar y sincronizar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
