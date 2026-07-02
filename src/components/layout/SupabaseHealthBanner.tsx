import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseHealth } from "@/hooks/useSupabaseHealth";
import { supabaseConfigError } from "@/integrations/supabase/client";

export function SupabaseHealthBanner() {
  const { data, isLoading, refetch, isFetching } = useSupabaseHealth();

  if (supabaseConfigError) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Supabase no está configurado. La app usará datos de demostración.</span>
        </div>
      </div>
    );
  }

  if (isLoading || data?.ok) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>No se pudo conectar con Supabase. {data?.message ?? "Revisa tu conexión."}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-red-200 bg-white text-red-900 hover:bg-red-100"
        onClick={() => refetch()}
        disabled={isFetching}
      >
        <RefreshCw className={isFetching ? "mr-1.5 h-3.5 w-3.5 animate-spin" : "mr-1.5 h-3.5 w-3.5"} />
        Reintentar
      </Button>
    </div>
  );
}
