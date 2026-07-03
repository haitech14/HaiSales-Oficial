import { ClienteEditableCell } from "@/components/app/ClienteEditableCell";
import { getSegmentStyles, getTipoClienteStyles } from "@/lib/clientes/clientes-service";
import type { ClienteEditableField } from "@/lib/clientes/clientes-service";
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
    <span className={cn("block truncate px-1.5 py-1 text-slate-500", className)} title={title ?? value}>
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

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50/60">
      <td className="app-table-cell font-medium text-slate-800">
        <ReadOnlyCell value={client.fechaAlta} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.ruc} onSave={save("ruc")} />
      </td>
      <td className="app-table-cell w-[260px] max-w-[260px]">
        <ClienteEditableCell
          value={client.razonSocial}
          onSave={save("razonSocial")}
          truncate
          title={client.razonSocial}
          inputClassName="font-semibold"
          displayValue={
            <span className="block truncate font-semibold text-slate-800">{client.razonSocial}</span>
          }
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.tipoCliente}
          onSave={save("tipoCliente")}
          type="select"
          options={clienteTipoOptions}
          displayValue={
            <span className={cn("app-table-badge", getTipoClienteStyles(client.tipoCliente))}>
              {client.tipoCliente}
            </span>
          }
        />
      </td>
      <td className="app-table-cell max-w-[220px]">
        <ReadOnlyCell
          value={client.equipoInteres}
          className="text-slate-700"
          title={client.equipoInteres}
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.produccionMensual}
          onSave={save("produccionMensual")}
          title="Producción mensual"
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.fechaToner}
          onSave={save("fechaToner")}
          inputType="date"
          title="Fecha toner"
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.segmento}
          onSave={save("segmento")}
          type="select"
          options={clienteSegmentoOptions}
          displayValue={
            <span className={cn("app-table-badge", getSegmentStyles(client.segmento))}>
              {client.segmento}
            </span>
          }
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.contacto} onSave={save("contacto")} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.telefono} onSave={save("telefono")} />
      </td>
      <td className="app-table-cell max-w-[220px]">
        <ClienteEditableCell
          value={client.direccion}
          onSave={save("direccion")}
          type="textarea"
          truncate
          title={client.direccion}
        />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.ciudad} onSave={save("ciudad")} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.provincia} onSave={save("provincia")} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.distrito} onSave={save("distrito")} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell value={client.correo} onSave={save("correo")} />
      </td>
      <td className="app-table-cell">
        <ClienteEditableCell
          value={client.cumpleanos}
          onSave={save("cumpleanos")}
          inputType="date"
          title="Cumpleaños"
        />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.ultimaCompra} />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.frecuenciaCompra} />
      </td>
      <td className="app-table-cell">
        <ReadOnlyCell value={client.ticketCompra} className="font-medium text-slate-700" />
      </td>
      <td className="app-table-cell max-w-[200px]">
        <ClienteEditableCell
          value={client.modelosInteres}
          onSave={save("modelosInteres")}
          type="textarea"
          truncate
          title={client.modelosInteres}
        />
      </td>
      <td className="app-table-cell max-w-[180px]">
        <ClienteEditableCell
          value={client.observaciones}
          onSave={save("observaciones")}
          type="textarea"
          truncate
          className="text-slate-500"
        />
      </td>
      <td className="app-table-cell text-right">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Más acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
