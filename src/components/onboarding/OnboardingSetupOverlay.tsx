import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EmpresaSetupModal } from "@/components/onboarding/EmpresaSetupModal";
import { useEmpresaSetupStatus } from "@/hooks/useEmpresaConfig";

export function OnboardingSetupOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShowSetup } = useEmpresaSetupStatus();
  const setupOpen = shouldShowSetup;

  useEffect(() => {
    if (!setupOpen) return;

    if (location.pathname !== "/app/dashboard") {
      navigate("/app/dashboard", { replace: true });
    }
  }, [setupOpen, location.pathname, navigate]);

  useEffect(() => {
    if (!setupOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [setupOpen]);

  if (!setupOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-[#04101f]/60 backdrop-blur-[4px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full justify-center overflow-y-auto px-4 py-8 sm:py-10">
        <div className="w-full max-w-2xl pb-8">
          <EmpresaSetupModal />
        </div>
      </div>
    </div>
  );
}
