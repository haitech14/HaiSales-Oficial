import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EmpresaSetupModal } from "@/components/onboarding/EmpresaSetupModal";
import { useEmpresaSetupStatus } from "@/hooks/useEmpresaConfig";

export function OnboardingSetupOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSetupComplete, isLoading } = useEmpresaSetupStatus();

  useEffect(() => {
    if (isLoading || isSetupComplete) return;

    if (location.pathname !== "/app/dashboard") {
      navigate("/app/dashboard", { replace: true });
    }
  }, [isLoading, isSetupComplete, location.pathname, navigate]);

  if (isLoading || isSetupComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-10">
      <div
        className="absolute inset-0 bg-[#04101f]/60 backdrop-blur-[4px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl pb-8">
        <EmpresaSetupModal />
      </div>
    </div>
  );
}
