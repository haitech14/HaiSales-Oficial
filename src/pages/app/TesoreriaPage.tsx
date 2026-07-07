import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppPageHeader } from "@/components/app/CrmShared";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { cn } from "@/lib/utils";
import CajaBancosPage from "@/pages/app/CajaBancosPage";
import CajaChicaPage from "@/pages/app/CajaChicaPage";

export type TesoreriaModulo = "caja-chica" | "bancos";

const tesoreriaModulos: Array<{ id: TesoreriaModulo; label: string }> = [
  { id: "caja-chica", label: "Caja Chica" },
  { id: "bancos", label: "Bancos" },
];

const moduloSubtitles: Record<TesoreriaModulo, string> = {
  "caja-chica":
    "Controla fondos, solicitudes, rendiciones, comprobantes y saldos por responsable.",
  bancos: "Gestiona cuentas bancarias, movimientos, conciliaciones, transferencias y saldos.",
};

function parseModulo(searchParams: URLSearchParams): TesoreriaModulo {
  const modulo = searchParams.get("modulo");
  if (modulo === "bancos") return "bancos";
  return "caja-chica";
}

export default function TesoreriaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeModulo, setActiveModulo] = useState<TesoreriaModulo>(() => parseModulo(searchParams));
  const rightPanel = useAppRightPanel();

  useEffect(() => {
    setActiveModulo(parseModulo(searchParams));
  }, [searchParams]);

  const handleModuloChange = (modulo: TesoreriaModulo) => {
    setActiveModulo(modulo);
    const params = new URLSearchParams(searchParams);
    if (modulo === "caja-chica") {
      params.delete("modulo");
    } else {
      params.set("modulo", modulo);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Caja Chica y Bancos"
        subtitle={moduloSubtitles[activeModulo]}
        showPanelToggle
        panelHidden={!rightPanel.isPanelVisible}
        onTogglePanel={rightPanel.togglePanel}
        hideHelp
        actionLabel="+ Nuevo movimiento"
        showActionDropdown
        onActionClick={() => undefined}
      />

      <div className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {tesoreriaModulos.map((modulo) => (
            <button
              key={modulo.id}
              type="button"
              onClick={() => handleModuloChange(modulo.id)}
              className={cn(
                "app-tab",
                activeModulo === modulo.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {modulo.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeModulo === "caja-chica" ? (
          <CajaChicaPage embedded rightPanel={rightPanel} />
        ) : (
          <CajaBancosPage embedded rightPanel={rightPanel} />
        )}
      </div>
    </div>
  );
}
