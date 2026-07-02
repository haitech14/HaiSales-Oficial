import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { PageLoader } from "@/components/layout/PageLoader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

const AppShell = lazy(() =>
  import("@/components/layout/AppShell").then((module) => ({ default: module.AppShell })),
);
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const AppIndexPage = lazy(() => import("@/pages/app/AppIndexPage"));
const AppPlaceholderPage = lazy(() => import("@/pages/app/AppPlaceholderPage"));
const ClientesPage = lazy(() => import("@/pages/app/ClientesPage"));
const InventarioPage = lazy(() => import("@/pages/app/InventarioPage"));
const ComprasPage = lazy(() => import("@/pages/app/ComprasPage"));
const AlmacenesPage = lazy(() => import("@/pages/app/AlmacenesPage"));
const IntegracionesPage = lazy(() => import("@/pages/app/IntegracionesPage"));
const LogisticaPage = lazy(() => import("@/pages/app/LogisticaPage"));
const PipelinePage = lazy(() => import("@/pages/app/PipelinePage"));
const VentasCrmPage = lazy(() => import("@/pages/app/VentasCrmPage"));
const VentasPage = lazy(() => import("@/pages/app/VentasPage"));
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const CajaBancosPage = lazy(() => import("@/pages/app/CajaBancosPage"));
const ContabilidadPage = lazy(() => import("@/pages/app/ContabilidadPage"));
const CuentasPorCobrarPage = lazy(() => import("@/pages/app/CuentasPorCobrarPage"));
const PlanillasPage = lazy(() => import("@/pages/app/PlanillasPage"));
const UsuariosPage = lazy(() => import("@/pages/app/UsuariosPage"));
const InboxPage = lazy(() => import("@/pages/inbox/InboxPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const placeholderRoutes = ["parametros"];

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Error al cargar HaiSales">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />

                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AppIndexPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="reportes" element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="tesoreria" element={<Navigate to="/app/caja-bancos" replace />} />
                    <Route path="caja-bancos" element={<CajaBancosPage />} />
                    <Route path="inbox" element={<InboxPage />} />
                    <Route path="whatsapp-crm" element={<Navigate to="/app/inbox" replace />} />
                    <Route path="ventas-crm" element={<VentasCrmPage />} />
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
                    <Route path="integraciones" element={<IntegracionesPage />} />
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
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
