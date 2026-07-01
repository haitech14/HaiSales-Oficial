export type VentaDocumentType = "Factura" | "Boleta" | "Nota de crédito";
export type VentaSunatStatus = "Aceptado" | "Pendiente" | "Rechazado";

export type VentaRecord = {
  id: string;
  date: string;
  time: string;
  documentType: VentaDocumentType;
  documentCode: string;
  client: string;
  ruc: string;
  amount: number;
  status: VentaSunatStatus;
  hasCdr: boolean;
  seller: string;
  sellerInitials: string;
};

export const ventasKpis = [
  {
    label: "Comprobantes emitidos",
    value: "328",
    change: "+12.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [18, 22, 20, 26, 24, 30, 28, 32],
  },
  {
    label: "Total facturado",
    value: "S/ 248,450",
    change: "+18.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [120, 140, 135, 160, 175, 190, 210, 248],
  },
  {
    label: "Pendientes SUNAT",
    value: "12",
    change: "-7.7% vs. mes anterior",
    changePositive: false,
    sparkColor: "#eab308",
    sparkPoints: [18, 16, 15, 14, 13, 12, 12, 12],
  },
  {
    label: "Rechazados",
    value: "3",
    change: "-25.0% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [8, 7, 6, 5, 4, 4, 3, 3],
  },
];

export const ventasTabs = [
  { id: "todos", label: "Todos", count: null as number | null },
  { id: "facturas", label: "Facturas", count: 144 },
  { id: "boletas", label: "Boletas", count: 98 },
  { id: "notas", label: "Notas crédito", count: 28 },
  { id: "pendientes", label: "Pendientes", count: 12 },
  { id: "rechazados", label: "Rechazados", count: 3 },
];

export const ventasRecords: VentaRecord[] = [
  {
    id: "1",
    date: "15/03/2026",
    time: "10:24",
    documentType: "Factura",
    documentCode: "F001-00001248",
    client: "Distribuidora Norte SAC",
    ruc: "20547896321",
    amount: 4850,
    status: "Aceptado",
    hasCdr: true,
    seller: "Jhelcen Romero",
    sellerInitials: "JR",
  },
  {
    id: "2",
    date: "15/03/2026",
    time: "09:58",
    documentType: "Boleta",
    documentCode: "B001-00004521",
    client: "María López Vargas",
    ruc: "10456782341",
    amount: 320,
    status: "Aceptado",
    hasCdr: true,
    seller: "Ana Martínez",
    sellerInitials: "AM",
  },
  {
    id: "3",
    date: "14/03/2026",
    time: "17:12",
    documentType: "Factura",
    documentCode: "F001-00001247",
    client: "Tech Solutions Perú EIRL",
    ruc: "20612345678",
    amount: 12800,
    status: "Pendiente",
    hasCdr: false,
    seller: "Juan Campos",
    sellerInitials: "JC",
  },
  {
    id: "4",
    date: "14/03/2026",
    time: "15:40",
    documentType: "Nota de crédito",
    documentCode: "FC01-00000089",
    client: "Comercial Andina SAC",
    ruc: "20123456789",
    amount: -1250,
    status: "Aceptado",
    hasCdr: true,
    seller: "María Gómez",
    sellerInitials: "MG",
  },
  {
    id: "5",
    date: "14/03/2026",
    time: "11:22",
    documentType: "Factura",
    documentCode: "F001-00001246",
    client: "Importaciones del Sur SAC",
    ruc: "20456789123",
    amount: 9640,
    status: "Rechazado",
    hasCdr: false,
    seller: "Jhelcen Romero",
    sellerInitials: "JR",
  },
  {
    id: "6",
    date: "13/03/2026",
    time: "16:05",
    documentType: "Boleta",
    documentCode: "B001-00004520",
    client: "Carlos Mendoza Ruiz",
    ruc: "10789456123",
    amount: 580,
    status: "Aceptado",
    hasCdr: true,
    seller: "Ana Martínez",
    sellerInitials: "AM",
  },
  {
    id: "7",
    date: "13/03/2026",
    time: "14:18",
    documentType: "Factura",
    documentCode: "F001-00001245",
    client: "Grupo Industrial Lima SAC",
    ruc: "20345678901",
    amount: 22450,
    status: "Aceptado",
    hasCdr: true,
    seller: "Juan Campos",
    sellerInitials: "JC",
  },
  {
    id: "8",
    date: "13/03/2026",
    time: "10:33",
    documentType: "Boleta",
    documentCode: "B001-00004519",
    client: "Rosa Quispe Huamán",
    ruc: "10876543210",
    amount: 195,
    status: "Pendiente",
    hasCdr: false,
    seller: "María Gómez",
    sellerInitials: "MG",
  },
  {
    id: "9",
    date: "12/03/2026",
    time: "18:47",
    documentType: "Factura",
    documentCode: "F001-00001244",
    client: "Logística Express SAC",
    ruc: "20567891234",
    amount: 7320,
    status: "Aceptado",
    hasCdr: true,
    seller: "Jhelcen Romero",
    sellerInitials: "JR",
  },
  {
    id: "10",
    date: "12/03/2026",
    time: "09:15",
    documentType: "Factura",
    documentCode: "F001-00001243",
    client: "Agroexport Perú SAC",
    ruc: "20198765432",
    amount: 15680,
    status: "Aceptado",
    hasCdr: true,
    seller: "Ana Martínez",
    sellerInitials: "AM",
  },
];

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(Math.abs(amount));

  return amount < 0 ? `-${formatted}` : formatted;
}

export function getSunatStatusStyles(status: VentaSunatStatus): string {
  switch (status) {
    case "Aceptado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Pendiente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rechazado":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

export function getDocumentTypeStyles(type: VentaDocumentType): string {
  switch (type) {
    case "Factura":
      return "text-blue-600";
    case "Boleta":
      return "text-violet-600";
    case "Nota de crédito":
      return "text-orange-600";
  }
}
