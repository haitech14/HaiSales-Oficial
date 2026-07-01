import type { DbProductType } from "@/lib/inventario/types";

export type NuevoProductoFormState = {
  tipo: DbProductType;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  marcaModelo: string;
  almacen: string;
  stockInicial: string;
  costoUnitario: string;
  precioVenta: string;
  afectacionIgv: string;
  estado: string;
};

export const defaultNuevoProductoForm: NuevoProductoFormState = {
  tipo: "product",
  sku: "",
  nombre: "",
  categoria: "",
  unidad: "",
  marcaModelo: "",
  almacen: "",
  stockInicial: "0",
  costoUnitario: "0.00",
  precioVenta: "0.00",
  afectacionIgv: "afecto",
  estado: "activo",
};

export const productoTipos = [
  { value: "product" as const, label: "Producto", icon: "package" },
  { value: "service" as const, label: "Servicio", icon: "wrench" },
  { value: "kit" as const, label: "Kit", icon: "boxes" },
];

export const productoCategorias = [
  { value: "Equipos", label: "Equipos" },
  { value: "Accesorios", label: "Accesorios" },
  { value: "Almacenamiento", label: "Almacenamiento" },
  { value: "General", label: "General" },
  { value: "Servicios", label: "Servicios" },
];

export const productoUnidades = [
  { value: "und", label: "Unidad (und)" },
  { value: "caja", label: "Caja" },
  { value: "kit", label: "Kit" },
  { value: "servicio", label: "Servicio" },
];

export const productoAlmacenes = [
  { value: "Almacén Principal", label: "Almacén Principal" },
  { value: "Almacén Central", label: "Almacén Central" },
  { value: "Almacén Norte", label: "Almacén Norte" },
  { value: "Almacén Sur", label: "Almacén Sur" },
];

export const productoAfectacionIgv = [
  { value: "afecto", label: "Afecto" },
  { value: "exonerado", label: "Exonerado" },
  { value: "inafecto", label: "Inafecto" },
];

export const productoEstados = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

export type CreateProductoInput = {
  sku?: string;
  nombre: string;
  tipo: DbProductType;
  categoria: string;
  unidad: string;
  marcaModelo?: string;
  almacen: string;
  stock: number;
  costo: number;
  precio: number;
  afectacionIgv: string;
  activo: boolean;
};

export function formToCreateInput(
  form: NuevoProductoFormState,
  mode: "draft" | "create",
): CreateProductoInput {
  return {
    sku: form.sku.trim() || undefined,
    nombre: form.nombre.trim(),
    tipo: form.tipo,
    categoria: form.categoria,
    unidad: form.unidad,
    marcaModelo: form.marcaModelo.trim() || undefined,
    almacen: form.almacen,
    stock: Number.parseFloat(form.stockInicial) || 0,
    costo: Number.parseFloat(form.costoUnitario) || 0,
    precio: Number.parseFloat(form.precioVenta) || 0,
    afectacionIgv: form.afectacionIgv,
    activo: mode === "create" && form.estado === "activo",
  };
}
