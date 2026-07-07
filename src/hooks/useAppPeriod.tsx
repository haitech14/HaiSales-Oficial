import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_PERIOD_PRESET,
  PERIOD_PRESET_OPTIONS,
  resolveMonthKeyRange,
  resolvePeriodRange,
  type PeriodPreset,
  type PeriodRange,
} from "@/lib/period-filter";
import { fetchAvailableVentaMonths } from "@/lib/ventas/ventas-period-utils";

type AppPeriodContextValue = {
  preset: PeriodPreset;
  salesMonthKey: string | null;
  range: PeriodRange;
  setPreset: (preset: PeriodPreset) => void;
  setSalesMonth: (monthKey: string) => void;
  options: typeof PERIOD_PRESET_OPTIONS;
  salesMonthOptions: Array<{ key: string; label: string }>;
};

const AppPeriodContext = createContext<AppPeriodContextValue | null>(null);

export function AppPeriodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preset, setPresetState] = useState<PeriodPreset>(DEFAULT_PERIOD_PRESET);
  const [salesMonthKey, setSalesMonthKey] = useState<string | null>(null);

  const { data: salesMonths = [] } = useQuery({
    queryKey: ["ventas", "available-months", user?.id ?? "guest"],
    queryFn: () => fetchAvailableVentaMonths(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const salesMonthOptions = useMemo(
    () =>
      salesMonths.map((monthKey) => ({
        key: monthKey,
        label: resolveMonthKeyRange(monthKey).label,
      })),
    [salesMonths],
  );

  const range = useMemo(() => {
    if (salesMonthKey) {
      return resolveMonthKeyRange(salesMonthKey);
    }
    return resolvePeriodRange(preset);
  }, [preset, salesMonthKey]);

  const setPreset = (nextPreset: PeriodPreset) => {
    setSalesMonthKey(null);
    setPresetState(nextPreset);
  };

  const setSalesMonth = (monthKey: string) => {
    setSalesMonthKey(monthKey);
    setPresetState("mes_con_ventas");
  };

  const value = useMemo(
    () => ({
      preset,
      salesMonthKey,
      range,
      setPreset,
      setSalesMonth,
      options: PERIOD_PRESET_OPTIONS,
      salesMonthOptions,
    }),
    [preset, salesMonthKey, range, salesMonthOptions],
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
