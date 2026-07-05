export const ventaClientes = [
  { label: "Distribuidora Norte SAC", ruc: "20547896321" },
  { label: "Comercial Andina EIRL", ruc: "20456789123" },
  { label: "Grupo Pacífico S.A.", ruc: "20198765432" },
  { label: "Inversiones Lima Norte SAC", ruc: "20654321890" },
];

export const ventaContactos = [
  "María López — Gerente General",
  "Carlos Mendoza — Jefe de Compras",
  "Ana Torres — Asistente Administrativa",
];

export const ventaOportunidades = [
  "OPP-2026-0148 — Implementación ERP",
  "OPP-2026-0092 — Licencias anuales",
  "OPP-2026-0201 — Servicio de soporte",
];

export const ventaProductos = [
  { label: "Licencia HaiSales Pro (anual)", codigo: "PRD-001", precio: 2400 },
  { label: "Implementación y capacitación", codigo: "SRV-012", precio: 3500 },
  { label: "Soporte técnico premium", codigo: "SRV-008", precio: 890 },
  { label: "Módulo de inventario adicional", codigo: "PRD-015", precio: 1200 },
];

import {
  VENTA_TIPOS_COMPROBANTE_FORM,
  DEFAULT_SERIES,
} from "@/lib/ventas/comprobantes";

export const ventaTiposComprobante = [...VENTA_TIPOS_COMPROBANTE_FORM];

export const ventaSeries = [
  DEFAULT_SERIES.serieFactura,
  "F002",
  DEFAULT_SERIES.serieBoleta,
  "B002",
  DEFAULT_SERIES.serieNotaCredito,
  DEFAULT_SERIES.serieNotaVenta,
];

export const ventaFormasPago = ["Contado", "Crédito 30 días", "Crédito 60 días", "Transferencia"];

export const ventaVendedores = [
  { name: "Jhelcen Romero", initials: "JR" },
  { name: "Ana Martínez", initials: "AM" },
  { name: "Juan Campos", initials: "JC" },
];

export const ventaEstadosIniciales = ["Negociación", "Propuesta", "Calificación", "Cierre ganado"];

export const empresaEmisor = {
  razonSocial: "HAI SALES TECHNOLOGY S.A.C.",
  ruc: "20601234567",
  direccion: "Av. Javier Prado Este 4200, Santiago de Surco, Lima",
  telefono: "+51 1 456 7890",
  email: "facturacion@haisales.pe",
};
