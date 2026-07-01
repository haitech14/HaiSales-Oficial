import type { WorkerRecord, WorkerStatus } from "@/lib/planillas-mock-data";

export type PlanillasWorker = WorkerRecord & {
  dbId?: string;
  esBorrador?: boolean;
};

export type PlanillasSnapshot = {
  workers: PlanillasWorker[];
  kpis: {
    label: string;
    value: string;
    change: string;
    changePositive: boolean;
    sparkColor: string;
    sparkPoints: number[];
    iconColor: string;
    iconBg: string;
  }[];
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

export type DbTrabajadorEstado = "activo" | "vacaciones" | "cesado" | "asistencia_pendiente";

export const estadoUiToDb: Record<string, DbTrabajadorEstado> = {
  activo: "activo",
  "asistencia-pendiente": "asistencia_pendiente",
  vacaciones: "vacaciones",
  cesado: "cesado",
};

export const estadoDbToUi: Record<DbTrabajadorEstado, WorkerStatus> = {
  activo: "Activo",
  asistencia_pendiente: "Asistencia pendiente",
  vacaciones: "Vacaciones",
  cesado: "Cesado",
};
