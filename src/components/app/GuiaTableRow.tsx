import { ClienteEditableCell } from "@/components/app/ClienteEditableCell";
import { GuiaConductorSelect } from "@/components/app/GuiaConductorSelect";
import { Eye } from "lucide-react";
import { getGuiaEstadoStyles } from "@/lib/logistica/guias-service";
import type { GuiaEditableField, GuiaRemision } from "@/lib/logistica/types";
import { GUIA_ESTADO_OPTIONS } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

type GuiaTableRowProps = {
  guia: GuiaRemision;
  conductorOptions: string[];
  onOpenDetail: (guiaId: string) => void;
  onSaveField: (guiaId: string, field: GuiaEditableField) => (value: string) => Promise<void>;
  onGenerateRotulo: (guia: GuiaRemision) => void;
};

export function GuiaTableRow({
  guia,
  conductorOptions,
  onOpenDetail,
  onSaveField,
  onGenerateRotulo,
}: GuiaTableRowProps) {
  const save = (field: GuiaEditableField) => onSaveField(guia.id, field);

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50/60">
      <td className="app-table-cell">
        <p className="font-medium text-slate-800">{guia.fecha}</p>
        <p className="text-xs text-slate-400">{guia.hora}</p>
      </td>
      <td className="app-table-cell whitespace-nowrap">
        <button
          type="button"
          onClick={() => onOpenDetail(guia.id)}
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          {guia.codigoGuia}
        </button>
      </td>
      <td className="app-table-cell max-w-[130px]">
        <ClienteEditableCell
          value={guia.sucursal}
          onSave={save("sucursal")}
          truncate
          compact
          inline
          title={guia.sucursal}
        />
      </td>
      <td className="app-table-cell max-w-[165px] w-[165px]">
        <ClienteEditableCell
          value={guia.destinatario}
          onSave={save("destinatario")}
          className="font-semibold text-slate-800"
          truncate
          compact
          inline
          title={guia.destinatario}
        />
      </td>
      <td className="app-table-cell whitespace-nowrap">
        <ClienteEditableCell
          value={guia.ruc}
          onSave={save("ruc")}
          compact
          inline
          nowrap
          title={guia.ruc}
        />
      </td>
      <td className="app-table-cell max-w-[140px]">
        <span className="block truncate text-slate-700" title={guia.contacto}>
          {guia.contacto}
        </span>
      </td>
      <td className="app-table-cell whitespace-nowrap text-slate-700">{guia.dni}</td>
      <td className="app-table-cell whitespace-nowrap text-slate-700">{guia.telefono}</td>
      <td className="app-table-cell whitespace-nowrap capitalize text-slate-700">{guia.motivoTraslado}</td>
      <td className="app-table-cell whitespace-nowrap text-slate-700">{guia.fechaTraslado}</td>
      <td className="app-table-cell whitespace-nowrap">
        <ClienteEditableCell
          value={guia.comprobanteRelacionado ?? "—"}
          onSave={save("comprobante")}
          compact
          inline
          nowrap
          displayValue={
            guia.comprobanteRelacionado ? (
              <span className="font-medium text-blue-600">{guia.comprobanteRelacionado}</span>
            ) : (
              <span className="text-slate-400">—</span>
            )
          }
        />
      </td>
      <td className="app-table-cell text-center text-slate-700">{guia.itemsCount}</td>
      <td className="app-table-cell whitespace-nowrap">
        <ClienteEditableCell
          value={guia.estado}
          type="select"
          options={[...GUIA_ESTADO_OPTIONS]}
          onSave={save("estado")}
          compact
          inline
          displayValue={
            <span
              className={cn(
                "app-table-badge inline-flex rounded-full border",
                getGuiaEstadoStyles(guia.estado),
              )}
            >
              {guia.estado}
            </span>
          }
        />
      </td>
      <td className="app-table-cell py-1">
        <GuiaConductorSelect
          value={guia.conductor}
          options={conductorOptions}
          onSave={save("conductor")}
        />
      </td>
      <td className="app-table-cell whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onGenerateRotulo(guia)}
            className="inline-flex h-7 items-center rounded-md border border-blue-200 bg-blue-50 px-2 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Generar Rótulo
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail(guia.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Ver guía"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
