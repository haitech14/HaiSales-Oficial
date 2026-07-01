import { useLocation } from "react-router-dom";
import { AppPageHeader } from "@/components/app/CrmShared";

export default function AppPlaceholderPage() {
  const location = useLocation();
  const title = location.pathname.split("/").pop()?.replace(/-/g, " ") ?? "Módulo";

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title={title.charAt(0).toUpperCase() + title.slice(1)}
        subtitle="Este módulo estará disponible próximamente."
        actionLabel="+ Nuevo registro"
      />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">Módulo en construcción</p>
          <p className="mt-2 text-sm text-slate-500">
            Usa Leads o Pipeline para ver las vistas implementadas.
          </p>
        </div>
      </div>
    </div>
  );
}
