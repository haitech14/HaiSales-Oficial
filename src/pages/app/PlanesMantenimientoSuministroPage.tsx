import { Wrench } from "lucide-react";
import { AppPageHeader } from "@/components/app/CrmShared";

export default function PlanesMantenimientoSuministroPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Planes de Mantenimiento y Suministro"
        subtitle="Programa mantenimientos preventivos, repuestos y suministros asociados a tus activos y clientes."
        actionLabel="+ Nuevo plan"
      />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wrench className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-700">Módulo en construcción</p>
          <p className="mt-2 text-sm text-slate-500">
            Próximamente podrás definir planes de servicio, visitas técnicas y reposición de insumos.
          </p>
        </div>
      </div>
    </div>
  );
}
