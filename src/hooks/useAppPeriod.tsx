import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PERIOD_PRESET,
  PERIOD_PRESET_OPTIONS,
  resolvePeriodRange,
  type PeriodPreset,
  type PeriodRange,
} from "@/lib/period-filter";

type AppPeriodContextValue = {
  preset: PeriodPreset;
  range: PeriodRange;
  setPreset: (preset: PeriodPreset) => void;
  options: typeof PERIOD_PRESET_OPTIONS;
};

const AppPeriodContext = createContext<AppPeriodContextValue | null>(null);

export function AppPeriodProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<PeriodPreset>(DEFAULT_PERIOD_PRESET);
  const range = useMemo(() => resolvePeriodRange(preset), [preset]);

  const value = useMemo(
    () => ({
      preset,
      range,
      setPreset,
      options: PERIOD_PRESET_OPTIONS,
    }),
    [preset, range],
  );

  return <AppPeriodContext.Provider value={value}>{children}</AppPeriodContext.Provider>;
}

export function useAppPeriod() {
  const context = useContext(AppPeriodContext);
  if (!context) {
    throw new Error("useAppPeriod debe usarse dentro de AppPeriodProvider");
  }
  return context;
}
