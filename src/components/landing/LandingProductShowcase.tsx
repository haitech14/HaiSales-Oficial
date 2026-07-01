import { Check } from "lucide-react";

const features = [
  {
    title: "XML/PDF",
    description: "Genera y envía el XML y PDF automáticamente.",
  },
  {
    title: "Notas de crédito",
    description: "Emite notas de crédito y débito fácilmente.",
  },
  {
    title: "Clientes y productos",
    description: "Gestiona catálogos y precios por cliente.",
  },
  {
    title: "Historial tributario",
    description: "Descarga y consulta tu historial de facturas.",
  },
];

const invoiceItems = [
  { product: "Laptop Empresarial 15", qty: 2, unit: "S/ 1,450.00", total: "S/ 2,900.00" },
  { product: "Mouse Inalámbrico", qty: 5, unit: "S/ 35.00", total: "S/ 175.00" },
  { product: "Teclado Mecánico", qty: 3, unit: "S/ 85.00", total: "S/ 255.00" },
];

const statusSteps = [
  { label: "Emitida", detail: "14/05/2024 10:23 am", state: "done" as const },
  { label: "Aceptada por SUNAT", detail: "14/05/2024 10:24 am", state: "done" as const },
  { label: "Pendiente de pago", detail: "Vence 28/05/2024", state: "pending" as const },
  { label: "Pagada", detail: "—", state: "upcoming" as const },
];

function QrPlaceholder() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <rect width="64" height="64" fill="#f8fafc" stroke="#e2e8f0" />
      <rect x="6" y="6" width="18" height="18" fill="#0f172a" />
      <rect x="40" y="6" width="18" height="18" fill="#0f172a" />
      <rect x="6" y="40" width="18" height="18" fill="#0f172a" />
      <rect x="30" y="30" width="8" height="8" fill="#0f172a" />
      <rect x="42" y="42" width="6" height="6" fill="#0f172a" />
      <rect x="50" y="34" width="4" height="4" fill="#0f172a" />
      <rect x="34" y="46" width="4" height="4" fill="#0f172a" />
    </svg>
  );
}

function StatusIcon({ state }: { state: "done" | "pending" | "upcoming" }) {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === "pending") {
    return <span className="h-6 w-6 shrink-0 rounded-full border-[3px] border-amber-400 bg-white" />;
  }
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-200 bg-white" />;
}

export function LandingProductShowcase() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.75fr)] lg:gap-6">
          <div className="lg:pt-2">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              Facturación electrónica lista para operar
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Cumple con la SUNAT y ofrece a tus clientes comprobantes profesionales y seguros.
            </p>
            <ul className="mt-8 space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Tu Empresa SAC</p>
                <p className="mt-0.5 text-xs text-slate-500">RUC 20123456789</p>
                <p className="text-xs text-slate-500">Av. Principal 123, Lima</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tracking-wide text-blue-700">FACTURA ELECTRÓNICA</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">F001-1258</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Cliente</p>
                <p className="mt-0.5 text-slate-600">Distribuidora Andina SAC</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">Emisión:</span> 14/05/2024
                </p>
                <p className="mt-0.5 text-slate-500">
                  <span className="font-semibold text-slate-700">Vencimiento:</span> 28/05/2024
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[320px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="px-2 py-2 font-medium">Producto</th>
                    <th className="px-2 py-2 font-medium">Cantidad</th>
                    <th className="px-2 py-2 font-medium">Precio Unit.</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {invoiceItems.map((item) => (
                    <tr key={item.product} className="border-b border-slate-50">
                      <td className="px-2 py-2">{item.product}</td>
                      <td className="px-2 py-2">{item.qty}</td>
                      <td className="px-2 py-2">{item.unit}</td>
                      <td className="px-2 py-2 text-right">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <QrPlaceholder />
              <div className="space-y-1 text-right text-xs">
                <p className="text-slate-600">
                  Subtotal <span className="font-medium text-slate-900">S/ 3,070.00</span>
                </p>
                <p className="text-slate-600">
                  IGV 18% <span className="font-medium text-slate-900">S/ 552.60</span>
                </p>
                <p className="pt-1 text-sm font-bold text-blue-700">
                  Total <span className="text-base">S/ 3,622.60</span>
                </p>
              </div>
            </div>
          </article>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
            <h3 className="text-sm font-bold text-slate-900">Estado del comprobante</h3>
            <ol className="mt-5 space-y-0">
              {statusSteps.map((step, index) => (
                <li key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <StatusIcon state={step.state} />
                    {index < statusSteps.length - 1 && (
                      <span
                        className={`my-1 w-0.5 flex-1 min-h-[28px] ${
                          step.state === "done" ? "bg-emerald-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-5 ${index === statusSteps.length - 1 ? "pb-0" : ""}`}>
                    <p
                      className={`text-sm font-semibold ${
                        step.state === "upcoming" ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`mt-0.5 text-xs ${
                        step.state === "pending"
                          ? "text-amber-600"
                          : step.state === "upcoming"
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
