import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SetupGuard } from "@/components/auth/SetupGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { PageLoader } from "@/components/layout/PageLoader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

const AppShell = lazyWithRetry(() =>
  import("@/components/layout/AppShell").then((module) => ({ default: module.AppShell })),
);
const ConfiguracionLayout = lazyWithRetry(() =>
  import("@/components/layout/ConfiguracionLayout").then((module) => ({
    default: module.ConfiguracionLayout,
  })),
);
const CheckoutPage = lazyWithRetry(() => import("@/pages/CheckoutPage"));
const Landing = lazyWithRetry(() => import("@/pages/Landing"));
const Login = lazyWithRetry(() => import("@/pages/Login"));
const AppIndexPage = lazyWithRetry(() => import("@/pages/app/AppIndexPage"));
const AppPlaceholderPage = lazyWithRetry(() => import("@/pages/app/AppPlaceholderPage"));
const ParametrosPage = lazyWithRetry(() => import("@/pages/app/ParametrosPage"));
const ClientesPage = lazyWithRetry(() => import("@/pages/app/ClientesPage"));
const InventarioPage = lazyWithRetry(() => import("@/pages/app/InventarioPage"));
const ComprasPage = lazyWithRetry(() => import("@/pages/app/ComprasPage"));
const AlmacenesPage = lazyWithRetry(() => import("@/pages/app/AlmacenesPage"));
const IntegracionesPage = lazyWithRetry(() => import("@/pages/app/IntegracionesPage"));
const LogisticaPage = lazyWithRetry(() => import("@/pages/app/LogisticaPage"));
const PipelinePage = lazyWithRetry(() => import("@/pages/app/PipelinePage"));
const VentasPage = lazyWithRetry(() => import("@/pages/app/VentasPage"));
const DashboardPage = lazyWithRetry(() => import("@/pages/app/DashboardPage"));
const TesoreriaPage = lazyWithRetry(() => import("@/pages/app/TesoreriaPage"));
const ContabilidadPage = lazyWithRetry(() => import("@/pages/app/ContabilidadPage"));
const CuentasPorCobrarPage = lazyWithRetry(() => import("@/pages/app/CuentasPorCobrarPage"));
const PlanillasPage = lazyWithRetry(() => import("@/pages/app/PlanillasPage"));
const UsuariosPage = lazyWithRetry(() => import("@/pages/app/UsuariosPage"));
const InboxPage = lazyWithRetry(() => import("@/pages/inbox/InboxPage"));
const AlquileresPage = lazyWithRetry(() => import("@/pages/app/AlquileresPage"));
const PlanesMantenimientoSuministroPage = lazyWithRetry(() =>
  import("@/pages/app/PlanesMantenimientoSuministroPage"),
);
const ServiciosPage = lazyWithRetry(() => import("@/pages/app/ServiciosPage"));
const AnunciosPage = lazyWithRetry(() => import("@/pages/app/AnunciosPage"));

const placeholderRoutes: string[] = [];

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Error al cargar HaiSales">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<Login />} />

                  <Route path="/onboarding" element={<Navigate to="/app/dashboard" replace />} />

                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <SetupGuard>
                          <AppShell />
                        </SetupGuard>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AppIndexPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="anuncios" element={<AnunciosPage />} />
                    <Route path="modulo" element={<Navigate to="/app/anuncios" replace />} />
                    <Route path="reportes" element={<Navigate to="/app/dashboard?mode=reportes" replace />} />
                    <Route path="tesoreria" element={<TesoreriaPage />} />
                    <Route
                      path="caja-bancos"
                      element={<Navigate to="/app/tesoreria" replace />}
                    />
                    <Route
                      path="caja-chica"
                      element={<Navigate to="/app/tesoreria?modulo=caja-chica" replace />}
                    />
                    <Route
                      path="bancos"
                      element={<Navigate to="/app/tesoreria?modulo=bancos" replace />}
                    />
                    <Route path="inbox" element={<InboxPage />} />
                    <Route path="whatsapp-crm" element={<Navigate to="/app/inbox" replace />} />
                    <Route path="ventas-crm" element={<Navigate to="/app/pipeline" replace />} />
                    <Route path="leads" element={<Navigate to="/app/pipeline" replace />} />
                    <Route path="ventas" element={<VentasPage />} />
                    <Route path="facturacion" element={<Navigate to="/app/ventas" replace />} />
                    <Route path="clientes" element={<ClientesPage />} />
                    <Route path="pipeline" element={<PipelinePage />} />
                    <Route path="contabilidad" element={<ContabilidadPage />} />
                    <Route path="cuentas-cobrar" element={<CuentasPorCobrarPage />} />
                    <Route path="inventario" element={<InventarioPage />} />
                    <Route path="compras" element={<ComprasPage />} />
                    <Route path="logistica" element={<LogisticaPage />} />
                    <Route path="almacenes" element={<AlmacenesPage />} />
                    <Route path="alquileres" element={<AlquileresPage />} />
                    <Route
                      path="planes-mantenimiento-suministro"
                      element={<PlanesMantenimientoSuministroPage />}
                    />
                    <Route path="servicios" element={<ServiciosPage />} />
                    <Route element={<ConfiguracionLayout />}>
                      <Route path="integraciones" element={<IntegracionesPage />} />
                      <Route path="parametros" element={<ParametrosPage />} />
                    </Route>
                    <Route path="planillas" element={<PlanillasPage />} />
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="cotizaciones" element={<Navigate to="/app/pipeline" replace />} />
                    <Route path="oportunidades" element={<Navigate to="/app/pipeline" replace />} />
                    <Route path="comprobantes" element={<Navigate to="/app/ventas" replace />} />
                    {placeholderRoutes.map((segment) => (
                      <Route key={segment} path={segment} element={<AppPlaceholderPage />} />
                    ))}
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
