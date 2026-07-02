import { useCallback, useState } from "react";
import { useIsBelowXl } from "@/hooks/use-media-query";

export function useAppRightPanel(initialHidden = false) {
  const isBelowXl = useIsBelowXl();
  const [panelHidden, setPanelHidden] = useState(initialHidden);
  const [mobileOpen, setMobileOpen] = useState(false);

  const togglePanel = useCallback(() => {
    if (isBelowXl) {
      setMobileOpen((current) => !current);
      return;
    }
    setPanelHidden((current) => !current);
  }, [isBelowXl]);

  const isPanelVisible = isBelowXl ? mobileOpen : !panelHidden;

  return {
    panelHidden,
    mobileOpen,
    setMobileOpen,
    togglePanel,
    isPanelVisible,
    isBelowXl,
  };
}
