import {
  HAISALES_ICON_SRC,
} from "@/components/landing/HaiSalesLogo";
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

const modules = [
  {
    icon: Filter,
    title: "Pipeline",
    description: "Visualiza y gestiona tu proceso de ventas",
  },
  {
    icon: Users,
    title: "Clientes",
    description: "Base única de clientes y contactos",
  },
  {
    icon: FileText,
    title: "Cotizaciones",
    description: "Crea y envía cotizaciones profesionales",
  },
  {
    icon: FileText,
    title: "Facturas",
    description: "Emite facturas electrónicas en segundos",
  },
  {
    icon: Package,
    title: "Inventario",
    description: "Controla productos, stock y movimientos",
  },
  {
    icon: BarChart3,
    title: "Analítica",
    description: "Dashboards y KPIs en tiempo real",
  },
];

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "CRM", icon: Users },
  { label: "Contactos", icon: UserRound },
  { label: "Empresas", icon: Users },
  { label: "Oportunidades", icon: Filter },
  { label: "Actividades", icon: Calendar },
  { label: "Calendario", icon: Calendar },
  { label: "Productos", icon: Package },
  { label: "Ventas", icon: TrendingUp },
  { label: "Facturación", icon: FileText },
  { label: "Reportes", icon: BarChart3 },
  { label: "Configuración", icon: Settings },
];

const dashboardKpis = [
  { label: "Oportunidades", value: "128", change: "+10%" },
  { label: "Nuevos Clientes", value: "32", change: "+12%" },
  { label: "Ventas Totales", value: "$58,420", change: "+22%" },
  { label: "Actividades", value: "245", change: "+0%" },
];

const pipelineStages = [
  { label: "Prospección", value: 45, width: "100%" },
  { label: "Calificación", value: 32, width: "78%" },
  { label: "Propuesta", value: 24, width: "62%" },
  { label: "Negociación", value: 18, width: "48%" },
  { label: "Cerrado Ganado", value: 12, width: "34%" },
];

const recentClients = [
  {
    client: "Distribuidora Andina",
    contact: "María L.",
    stage: "Propuesta",
    value: "S/ 24,560",
    activity: "Hace 2h",
    status: "En Proceso",
    statusColor: "bg-blue-100 text-blue-700",
  },
  {
    client: "TechSolutions SAC",
    contact: "Carlos R.",
    stage: "Negociación",
    value: "S/ 18,320",
    activity: "Ayer",
    status: "Pendiente",
    statusColor: "bg-amber-100 text-amber-700",
  },
  {
    client: "Importaciones Lima",
    contact: "Ana P.",
    stage: "Cerrado",
    value: "S/ 15,890",
    activity: "Hace 3d",
    status: "Cerrado",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
];

function IncomeLineChart() {
  return (
    <svg viewBox="0 0 280 80" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,60 L35,52 L70,48 L105,38 L140,42 L175,28 L210,32 L245,18 L280,22 L280,80 L0,80 Z"
        fill="url(#incomeGradient)"
      />
      <polyline
        points="0,60 35,52 70,48 105,38 140,42 175,28 210,32 245,18 280,22"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrmDashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_8px_40px_rgba(15,23,42,0.12)]">
      <div className="flex min-h-[480px]">
        {/* Sidebar */}
        <aside className="hidden w-[148px] shrink-0 bg-[#0c1a32] px-3 py-4 lg:block">
          <div className="flex items-center gap-2 px-1">
            <img
              src={HAISALES_ICON_SRC}
              alt="HaiSales"
              className="h-7 w-7 rounded-md object-cover object-left"
              width={28}
              height={28}
            />
          </div>
          <nav className="mt-5 space-y-0.5">
            {sidebarNav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${
                  item.active
                    ? "bg-blue-600/30 font-medium text-white"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 bg-white">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:flex">
              <Search className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-400">Buscar...</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bell className="h-3.5 w-3.5 text-slate-400" />
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <span className="h-6 w-6 rounded-full bg-blue-100" />
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {/* Greeting */}
            <div>
              <h4 className="app-panel-title">
                Bienvenido, Carlos <span aria-hidden="true">👋</span>
              </h4>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Aquí tienes un resumen de tu actividad comercial de hoy.
              </p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {dashboardKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm"
                >
                  <p className="text-[9px] text-slate-500">{kpi.label}</p>
                  <p className="mt-0.5 app-panel-title">{kpi.value}</p>
                  <p className="mt-0.5 text-[9px] font-medium text-emerald-600">{kpi.change}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Pipeline */}
              <div className="rounded-lg border border-slate-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-slate-900">Pipeline de Ventas</p>
                <div className="mt-2.5 space-y-1.5">
                  {pipelineStages.map((stage) => (
                    <div key={stage.label} className="flex items-center gap-2">
                      <span className="w-[72px] shrink-0 truncate text-[8px] text-slate-500">
                        {stage.label}
                      </span>
                      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-blue-600"
                          style={{ width: stage.width }}
                        />
                      </div>
                      <span className="w-5 shrink-0 text-right text-[8px] font-semibold text-slate-700">
                        {stage.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income chart */}
              <div className="rounded-lg border border-slate-100 p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-900">Ingresos</p>
                  <span className="text-[8px] text-slate-400">Mayo</span>
                </div>
                <div className="mt-1 h-[72px]">
                  <IncomeLineChart />
                </div>
              </div>
            </div>

            {/* Recent clients table */}
            <div className="overflow-x-auto rounded-lg border border-slate-100 shadow-sm">
              <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold text-slate-900">
                Clientes Recientes
              </p>
              <table className="w-full min-w-[420px] text-[8px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-500">
                    <th className="px-2 py-1.5 font-medium">Cliente</th>
                    <th className="px-2 py-1.5 font-medium">Contacto</th>
                    <th className="px-2 py-1.5 font-medium">Etapa</th>
                    <th className="px-2 py-1.5 font-medium">Valor</th>
                    <th className="px-2 py-1.5 font-medium">Última act.</th>
                    <th className="px-2 py-1.5 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {recentClients.map((row) => (
                    <tr key={row.client} className="border-t border-slate-50">
                      <td className="px-2 py-1.5 font-medium">{row.client}</td>
                      <td className="px-2 py-1.5">{row.contact}</td>
                      <td className="px-2 py-1.5">{row.stage}</td>
                      <td className="px-2 py-1.5">{row.value}</td>
                      <td className="px-2 py-1.5">{row.activity}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`inline-block rounded-full px-1.5 py-0.5 text-[7px] font-medium ${row.statusColor}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingGrowthShowcase() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] lg:gap-14">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              Una plataforma modular para cada etapa de tu venta
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
              Gestiona todo tu proceso comercial desde un solo lugar con módulos integrados y fáciles
              de usar.
            </p>

            <ul className="mt-8 divide-y divide-slate-100">
              {modules.map((mod) => (
                <li key={mod.title}>
                  <a
                    href="#modulos"
                    className="group flex items-center gap-4 py-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <mod.icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="app-panel-title">{mod.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{mod.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <CrmDashboardPreview />
        </div>
      </section>
  );
}
