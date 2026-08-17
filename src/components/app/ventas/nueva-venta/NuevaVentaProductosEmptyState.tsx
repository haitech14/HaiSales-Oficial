import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";

export function NuevaVentaProductosEmptyState() {
  return (
    <ModuleEmptyState
      message="Busca un producto o escanea su código de barras"
      className="flex-1 py-8"
    />
  );
}
