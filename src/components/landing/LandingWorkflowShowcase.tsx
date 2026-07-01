import {
  BarChart3,
  BookOpen,
  ChevronDown,
  DollarSign,
  FileText,
  Home,
  LayoutGrid,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const steps = [
  "Captura lead",
  "Haz seguimiento",
  "Cierra venta",
  "Emite factura",
  "Cobra y mide",
];

const sidebarNav = [
  { label: "Inicio", icon: Home },
  { label: "Pipeline", icon: LayoutGrid, active: true },
  { label: "Contactos", icon: Users },
  { label: "Cotizaciones", icon: FileText },
  { label: "Facturas", icon: FileText },
  { label: "Productos", icon: Package },
  { label: "Reportes", icon: BarChart3 },
  { label: "Configuración", icon: Settings },
];

const kanbanColumns = [
  {
    title: "Prospectos",
    count: 12,
    cards: [
      { name: "Distribuidora Andina", amount: "S/ 4,500", time: "Hoy" },
      { name: "Comercial Norte", amount: "S/ 2,800", time: "1 día" },
      { name: "Servicios Integrales", amount: "S/ 1,900", time: "2 días" },
    ],
  },
  {
    title: "Calificados",
    count: 8,
    cards: [
      { name: "TechSolutions SAC", amount: "S/ 6,200", time: "Hoy" },
      { name: "Importaciones Lima", amount: "S/ 3,400", time: "1 día" },
    ],
  },
  {
    title: "Propuesta",
    count: 5,
    cards: [
      { name: "Constructora Norte", amount: "S/ 8,500", time: "Hoy" },
      { name: "Ferremax", amount: "S/ 5,100", time: "2 días" },
    ],
  },
  {
    title: "Cierre",
    count: 3,
    cards: [
      { name: "Retail Express", amount: "S/ 5,300", time: "Hoy", selected: true },
      { name: "Verde Distribuciones", amount: "S/ 4,200", time: "1 día" },
    ],
  },
];

const integrations: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}[] = [
  {
    icon: MessageCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "WhatsApp",
    description: "Envía y recibe mensajes",
  },
  {
    icon: Mail,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Email",
    description: "Notificaciones automáticas",
  },
  {
    icon: Package,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Inventario",
    description: "Control de stock en tiempo real",
  },
  {
    icon: DollarSign,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Pagos",
    description: "Registra cobros y abonos",
  },
  {
    icon: BookOpen,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Contabilidad",
    description: "Exporta a tu sistema contable",
  },
  {
    icon: Plus,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    title: "Más integraciones",
    description: "Próximamente más conexiones",
  },
];

function PipelineMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.1)]">
      <div className="flex min-h-[420px]">
        <aside className="hidden w-[130px] shrink-0 bg-[#081b33] px-2.5 py-4 sm:block">
          <div className="flex items-center gap-2 px-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
              <BarChart3 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold text-white">HaiSales</span>
          </div>
          <nav className="mt-5 space-y-0.5">
            {sidebarNav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${
                  item.active
                    ? "bg-blue-600/40 font-medium text-white"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-4">
            <h4 className="app-panel-title">Pipeline de ventas</h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-600"
              >
                Filtros
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-medium text-white"
              >
                <Plus className="h-3 w-3" />
                Nueva oportunidad
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto p-3 sm:p-4">
            {kanbanColumns.map((column) => (
              <div
                key={column.title}
                className="w-[140px] shrink-0 rounded-lg bg-slate-50 p-2 sm:w-[155px]"
              >
                <p className="mb-2 text-[10px] font-semibold text-slate-700">
                  {column.title}{" "}
                  <span className="font-normal text-slate-400">({column.count})</span>
                </p>
                <div className="space-y-1.5">
                  {column.cards.map((card) => (
                    <div
                      key={card.name}
                      className={`rounded-md border bg-white p-2 ${
                        card.selected
                          ? "border-blue-400 ring-1 ring-blue-200"
                          : "border-slate-100"
                      }`}
                    >
                      <p className="text-[10px] font-semibold text-slate-800">{card.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-blue-600">{card.amount}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{card.time}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 text-[9px] font-medium text-blue-600 hover:text-blue-700"
                >
                  + Agregar oportunidad
                </button>
              </div>
            ))}

            <div className="hidden w-[155px] shrink-0 rounded-lg border border-slate-200 bg-white p-3 lg:block">
              <p className="text-xs font-bold text-slate-900">Retail Express</p>
              <div className="mt-3 space-y-2.5 text-[10px]">
                <div>
                  <p className="text-slate-400">Etapa</p>
                  <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                    Cierre
                  </span>
                </div>
                <div>
                  <p className="text-slate-400">Valor</p>
                  <p className="font-bold text-slate-900">S/ 5,300.00</p>
                </div>
                <div>
                  <p className="text-slate-400">Probabilidad</p>
                  <p className="font-semibold text-slate-800">100%</p>
                </div>
                <div>
                  <p className="text-slate-400">Cierre estimado</p>
                  <p className="font-semibold text-slate-800">15 Jun 2025</p>
                </div>
                <div>
                  <p className="text-slate-400">Responsable</p>
                  <p className="font-semibold text-slate-800">María Gómez</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-md bg-blue-600 py-1.5 text-[10px] font-semibold text-white"
              >
                Ver detalle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingWorkflowShowcase() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Así funciona */}
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          Así funciona HaiSales
        </h2>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-slate-700">{step}</span>
              </div>
              {index < steps.length - 1 && (
                <span className="mx-2 hidden h-px w-8 border-t border-dashed border-slate-300 sm:mx-3 sm:w-12 md:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PipelineMockup />
        </div>

        {/* Integraciones */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Conecta y automatiza tu negocio
          </h2>
          <p className="mt-3 text-center text-base text-slate-500">
            HaiSales se integra con las herramientas que ya usas.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item) => (
              <article
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                >
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="app-panel-title">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
