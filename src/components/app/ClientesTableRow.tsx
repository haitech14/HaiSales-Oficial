import { ClienteEditableCell } from "@/components/app/ClienteEditableCell";
import { ClientesWhatsAppCell } from "@/components/app/clientes/ClientesWhatsAppCell";
import { getSegmentStyles, getTipoClienteStyles, formatClienteRazonSocialDisplay, shouldShowNombreComercial } from "@/lib/clientes/clientes-service";
import type { ClienteEditableField } from "@/lib/clientes/clientes-service";
import {
  displayRucDocumento,
  isDniDocumento,
  resolveClienteContacto,
} from "@/lib/clientes/contacto-from-ruc";
import { clienteSegmentoOptions, clienteTipoOptions, type ClientRecord } from "@/lib/clientes-mock-data";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

type ClientesTableRowProps = {
  client: ClientRecord;
  onUpdateField: (clientId: string, field: ClienteEditableField, value: string) => Promise<void>;
};

function ReadOnlyCell({
  value,
  className,
  title,
}: {
  value: string;
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn("block truncate px-1 py-0.5 text-[12px] text-slate-500", className)} title={title ?? value}>
      {value}
    </span>
  );
}

export function ClientesTableRow({ client, onUpdateField }: ClientesTableRowProps) {
  const save =
    (field: ClienteEditableField) =>
    async (value: string) => {
      await onUpdateField(client.id, field, value);
    };

  const contacto = resolveClienteContacto(client.ruc, client.razonSocial, client.contacto);
  const dni = client.dni || "—";
  const displayRuc = displayRucDocumento(client.ruc);
  const razonTitle = formatClienteRazonSocialDisplay(client.razonSocial, client.nombreComercial);
  const showNombreComercial = shouldShowNombreComercial(client.razonSocial, client.nombreComercial);

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50/60">
      <td className="app-table-cell font-medium text-slate-800">
        <ReadOnlyCell value={client.fechaAlta} className="text-[12px]" />
      </td>
      <td className="app-table-cell">
        {isDniDocumento(client.ruc) ? (
          <ReadOnlyCell value="—" className="text-[12px]" />
        ) : (
          <ClienteEditableCell value={displayRuc} onSave={save("ruc")} compact />
        )}
      </td>
      <td className="app-table-cell w-[260px] max-w-[260px]">
        <ClienteEditableCell
          value={client.razonSocial}
          onSave={save("razonSocial")}
          truncate
          compact
          title={razonTitle}
          inputClassName="font-semibold"
          displayValue={
            <span className="block truncate text-[12px] font-semibold text-slate-800" title={razonTitle}>
              {client.razonSocial}
              {showNombreComercial ? (
                <span className="font-normal text-slate-500"> ({client.nombreComercial.trim()})</span>
              ) : null}
            </span>
          }
        />
      </td>
      <td className="app-table-cell w-[180px] min-w-[160px] max-w-[180px]">
        <ClienteEditableCell value={contacto} onSave={save("contacto")} compact truncate title={contacto} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={dni} onSave={save("dni")} compact title="DNI de la persona de atención" />
      </td>
      <td className="app-table-cell w-[160px] min-w-[140px] max-w-[160px]">
        <ClientesWhatsAppCell telefono={client.telefono} onSave={save("telefono")} />
      </td>
      <td className="app-table-cell min-w-[148px]">
        <ClienteEditableCell
          value={client.tipoCliente}
          onSave={save("tipoCliente")}
          type="select"
          compact
          options={clienteTipoOptions}
          displayValue={
            <span className={cn("app-table-badge max-w-full truncate", getTipoClienteStyles(client.tipoCliente))}>
              {client.tipoCliente}
            </span>
          }
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.segmento}
          onSave={save("segmento")}
          type="select"
          compact
          options={clienteSegmentoOptions}
          displayValue={
            <span className={cn("app-table-badge", getSegmentStyles(client.segmento))}>
              {client.segmento}
            </span>
          }
        />
      </td>
      <td className="app-table-cell max-w-[220px]">
        <ClienteEditableCell
          value={client.direccion}
          onSave={save("direccion")}
          type="textarea"
          truncate
          compact
          title={client.direccion}
        />
      </td>
      <td className="app-table-cell w-[200px] min-w-[200px] max-w-[200px]">
        <ClienteEditableCell value={client.distrito} onSave={save("distrito")} compact truncate />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.ciudad} onSave={save("ciudad")} compact />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.provincia} onSave={save("provincia")} compact />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.pais} onSave={save("pais")} compact />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.correo} onSave={save("correo")} compact />
      </td>
      <td className="app-table-cell max-w-[240px]">
        <ReadOnlyCell
          value={client.equipoInteres}
          className="text-[12px] text-slate-700"
          title={client.equipoInteres}
        />
      </td>
      <td className="app-table-cell max-w-[280px]">
        <ReadOnlyCell
          value={client.modelosInteres}
          className="text-[12px] text-slate-700"
          title={client.modelosInteres}
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.fechaToner}
          onSave={save("fechaToner")}
          compact
          inputType="date"
          title="Último tóner"
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.produccionMensual}
          onSave={save("produccionMensual")}
          compact
          title="Producción mensual"
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.cumpleanos}
          onSave={save("cumpleanos")}
          compact
          inputType="date"
          title="Cumpleaños"
        />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.ultimaCompra} className="text-[12px]" />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.frecuenciaCompra} className="text-[12px]" />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.ticketCompra} className="text-[12px] font-medium text-slate-700" />
      </td>
      <td className="app-table-cell max-w-[180px]">
        <ClienteEditableCell
          value={client.observaciones}
          onSave={save("observaciones")}
          type="textarea"
          truncate
          compact
          className="text-slate-500"
        />
      </td>
      <td className="app-table-cell text-right">
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Más acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
