import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    </div>
  );
}
