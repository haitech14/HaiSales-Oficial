type KpiLike = {
  label: string;
  value: string;
  change: string;
  changePositive?: boolean;
  sparkColor: string;
  sparkPoints: number[];
  iconBg?: string;
  iconColor?: string;
};

export function emptyKpiValue(value = "0"): string {
  return value;
}

export function withRealKpi<T extends KpiLike>(
  kpi: T,
  value: string,
  change = "Sin datos en el periodo",
): T {
  const hasData = value !== "0" && value !== "S/ 0" && value !== "—" && value !== "0%";
  return {
    ...kpi,
    value,
    change: hasData ? kpi.change : change,
    changePositive: hasData ? kpi.changePositive : undefined,
  };
}
