export type PeriodPreset =
  | "mes_actual"
  | "mes_anterior"
  | "trimestre_actual"
  | "trimestre_anterior"
  | "semestre_actual"
  | "anio_actual"
  | "todos";

export type PeriodRange = {
  preset: PeriodPreset;
  start: string;
  end: string;
  label: string;
  shortLabel: string;
};

export const DEFAULT_PERIOD_PRESET: PeriodPreset = "mes_actual";

export const PERIOD_PRESET_OPTIONS: { id: PeriodPreset; label: string }[] = [
  { id: "mes_actual", label: "Mes actual" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "trimestre_actual", label: "Trimestre actual" },
  { id: "trimestre_anterior", label: "Trimestre anterior" },
  { id: "semestre_actual", label: "Semestre actual" },
  { id: "anio_actual", label: "Año actual" },
  { id: "todos", label: "Todo el historial" },
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function quarterBounds(date: Date): { start: Date; end: Date; quarter: number } {
  const quarter = Math.floor(date.getMonth() / 3);
  const start = new Date(date.getFullYear(), quarter * 3, 1);
  const end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
  return { start, end, quarter: quarter + 1 };
}

function formatMonthLabel(date: Date): string {
  const label = date.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return formatMonthLabel(start);
  }

  const startText = start.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const endText = end.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${startText} - ${endText}`;
}

export function resolvePeriodRange(
  preset: PeriodPreset,
  reference = new Date(),
): PeriodRange {
  if (preset === "todos") {
    return {
      preset,
      start: "1970-01-01",
      end: "2999-12-31",
      label: "Todo el historial",
      shortLabel: "Todo",
    };
  }

  if (preset === "mes_actual") {
    const start = startOfMonth(reference);
    const end = endOfMonth(reference);
    return {
      preset,
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: formatMonthLabel(reference),
      shortLabel: reference.toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
    };
  }

  if (preset === "mes_anterior") {
    const monthRef = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    const start = startOfMonth(monthRef);
    const end = endOfMonth(monthRef);
    return {
      preset,
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: formatMonthLabel(monthRef),
      shortLabel: monthRef.toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
    };
  }

  if (preset === "trimestre_actual" || preset === "trimestre_anterior") {
    const offset = preset === "trimestre_anterior" ? -3 : 0;
    const quarterRef = new Date(reference.getFullYear(), reference.getMonth() + offset, 1);
    const { start, end, quarter } = quarterBounds(quarterRef);
    return {
      preset,
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: `Q${quarter} ${quarterRef.getFullYear()}`,
      shortLabel: `Q${quarter} ${quarterRef.getFullYear()}`,
    };
  }

  if (preset === "semestre_actual") {
    const semester = reference.getMonth() < 6 ? 1 : 2;
    const start = new Date(reference.getFullYear(), semester === 1 ? 0 : 6, 1);
    const end = new Date(reference.getFullYear(), semester === 1 ? 6 : 12, 0);
    return {
      preset,
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: `S${semester} ${reference.getFullYear()}`,
      shortLabel: `S${semester} ${reference.getFullYear()}`,
    };
  }

  const start = new Date(reference.getFullYear(), 0, 1);
  const end = new Date(reference.getFullYear(), 11, 31);
  return {
    preset: "anio_actual",
    start: toIsoDate(start),
    end: toIsoDate(end),
    label: `Año ${reference.getFullYear()}`,
    shortLabel: String(reference.getFullYear()),
  };
}

export function parseDisplayDateToIso(display: string): string | null {
  const [day, month, year] = display.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function isIsoDateInRange(
  isoDate: string | null | undefined,
  range: PeriodRange,
): boolean {
  if (range.preset === "todos") return true;
  if (!isoDate) return false;
  const normalized = isoDate.includes("T") ? isoDate.slice(0, 10) : isoDate;
  return normalized >= range.start && normalized <= range.end;
}

export function isPeriodMonthInRange(periodMonth: string | undefined, range: PeriodRange): boolean {
  if (range.preset === "todos" || !periodMonth) return range.preset === "todos";
  const monthStart = `${periodMonth}-01`;
  const [year, month] = periodMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${periodMonth}-${String(lastDay).padStart(2, "0")}`;
  return monthEnd >= range.start && monthStart <= range.end;
}

export function resolvePreviousPeriodRange(
  preset: PeriodPreset,
  reference = new Date(),
): PeriodRange {
  if (preset === "mes_actual") {
    return resolvePeriodRange("mes_anterior", reference);
  }

  if (preset === "mes_anterior") {
    const prevRef = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    return resolvePeriodRange("mes_anterior", prevRef);
  }

  if (preset === "trimestre_actual") {
    return resolvePeriodRange("trimestre_anterior", reference);
  }

  if (preset === "trimestre_anterior") {
    const prevRef = new Date(reference.getFullYear(), reference.getMonth() - 3, 1);
    return resolvePeriodRange("trimestre_anterior", prevRef);
  }

  if (preset === "semestre_actual") {
    const semester = reference.getMonth() < 6 ? 1 : 2;
    if (semester === 1) {
      const prevYear = reference.getFullYear() - 1;
      return {
        preset: "semestre_actual",
        start: toIsoDate(new Date(prevYear, 6, 1)),
        end: toIsoDate(new Date(prevYear, 11, 31)),
        label: `S2 ${prevYear}`,
        shortLabel: `S2 ${prevYear}`,
      };
    }
    return {
      preset: "semestre_actual",
      start: toIsoDate(new Date(reference.getFullYear(), 0, 1)),
      end: toIsoDate(new Date(reference.getFullYear(), 5, 30)),
      label: `S1 ${reference.getFullYear()}`,
      shortLabel: `S1 ${reference.getFullYear()}`,
    };
  }

  if (preset === "anio_actual") {
    const year = reference.getFullYear() - 1;
    return {
      preset: "anio_actual",
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `Año ${year}`,
      shortLabel: String(year),
    };
  }

  const year = reference.getFullYear() - 1;
  return {
    preset: "anio_actual",
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `Año ${year}`,
    shortLabel: String(year),
  };
}

export type ChartBucket = {
  label: string;
  start: string;
  end: string;
};

export function buildPeriodChartBuckets(range: PeriodRange): ChartBucket[] {
  if (range.preset === "todos") {
    return [{ label: "Total", start: range.start, end: range.end }];
  }

  const startDate = new Date(`${range.start}T12:00:00`);
  const endDate = new Date(`${range.end}T12:00:00`);
  const sameMonth = range.start.slice(0, 7) === range.end.slice(0, 7);

  if (sameMonth) {
    const buckets: ChartBucket[] = [];
    const cursor = new Date(startDate);
    let week = 1;

    while (cursor <= endDate) {
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 6);
      const end = bucketEnd > endDate ? endDate : bucketEnd;
      buckets.push({
        label: `S${week}`,
        start: toIsoDate(cursor),
        end: toIsoDate(end),
      });
      cursor.setTime(end.getTime());
      cursor.setDate(cursor.getDate() + 1);
      week += 1;
    }

    return buckets.length > 0 ? buckets : [{ label: range.shortLabel, start: range.start, end: range.end }];
  }

  const buckets: ChartBucket[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const bucketStart = monthStart < startDate ? startDate : monthStart;
    const bucketEnd = monthEnd > endDate ? endDate : monthEnd;

    buckets.push({
      label: cursor.toLocaleDateString("es-PE", { month: "short" }),
      start: toIsoDate(bucketStart),
      end: toIsoDate(bucketEnd),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets.length > 0 ? buckets : [{ label: range.shortLabel, start: range.start, end: range.end }];
}
