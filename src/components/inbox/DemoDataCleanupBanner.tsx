import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInvalidateEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { clearDemoDataForUser } from "@/lib/seed-demo";
import { dismissDemoCleanupPrompt } from "@/lib/parametros/empresa-service";

type DemoDataCleanupBannerProps = {
  userId: string;
  onCleaned?: () => void;
};

export function DemoDataCleanupBanner({ userId, onCleaned }: DemoDataCleanupBannerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const invalidateEmpresaConfig = useInvalidateEmpresaConfig();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await clearDemoDataForUser(userId);
      toast.success("Datos de prueba eliminados");
      invalidateEmpresaConfig();
      onCleaned?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron eliminar los datos de prueba");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissDemoCleanupPrompt(userId);
      invalidateEmpresaConfig();
      onCleaned?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo ocultar el aviso");
    }
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6">
      <p className="text-xs text-amber-900 sm:text-sm">
        Tu empresa ya está configurada. Puedes eliminar los datos de demostración cargados al inicio.
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-amber-300 bg-white text-xs text-amber-900 hover:bg-amber-100"
          disabled={isDeleting}
          onClick={() => void handleDismiss()}
        >
          Ocultar
        </Button>
        <Button
          size="sm"
          className="h-8 bg-amber-600 text-xs hover:bg-amber-500"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {isDeleting ? "Eliminando..." : "Eliminar datos de prueba"}
        </Button>
      </div>
    </div>
  );
}
