import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";

type GuiasEmptyStateProps = {
  message?: string;
  hint?: string;
  className?: string;
};

export function GuiasEmptyState({
  message = "No se encontraron documentos emitidos en esta fecha.",
  hint,
  className,
}: GuiasEmptyStateProps) {
  return <ModuleEmptyState message={message} hint={hint} className={className} />;
}
