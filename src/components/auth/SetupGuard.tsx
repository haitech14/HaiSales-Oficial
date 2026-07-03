import type { ReactNode } from "react";
import { PageLoader } from "@/components/layout/PageLoader";
import { useEmpresaSetupStatus } from "@/hooks/useEmpresaConfig";

export function SetupGuard({ children }: { children: ReactNode }) {
  const { isLoading } = useEmpresaSetupStatus();

  if (isLoading) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
