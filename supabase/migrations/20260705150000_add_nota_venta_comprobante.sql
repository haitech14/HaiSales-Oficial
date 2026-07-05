-- Nota de Venta: tipo de comprobante y serie en configuración de empresa

ALTER TABLE public.ventas DROP CONSTRAINT IF EXISTS ventas_tipo_comprobante_check;

ALTER TABLE public.ventas
  ADD CONSTRAINT ventas_tipo_comprobante_check
  CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_credito', 'nota_venta'));

ALTER TABLE public.empresa_config
  ADD COLUMN IF NOT EXISTS serie_nota_venta TEXT DEFAULT 'NV01';
