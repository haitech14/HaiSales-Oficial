import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AppIndexPage from "@/pages/app/AppIndexPage";
import AppPlaceholderPage from "@/pages/app/AppPlaceholderPage";
import ClientesPage from "@/pages/app/ClientesPage";
import InventarioPage from "@/pages/app/InventarioPage";
import ComprasPage from "@/pages/app/ComprasPage";
import AlmacenesPage from "@/pages/app/AlmacenesPage";
import IntegracionesPage from "@/pages/app/IntegracionesPage";
import LogisticaPage from "@/pages/app/LogisticaPage";
import PipelinePage from "@/pages/app/PipelinePage";
import VentasCrmPage from "@/pages/app/VentasCrmPage";
import VentasPage from "@/pages/app/VentasPage";
import DashboardPage from "@/pages/app/DashboardPage";
import CajaBancosPage from "@/pages/app/CajaBancosPage";
import ContabilidadPage from "@/pages/app/ContabilidadPage";
import CuentasPorCobrarPage from "@/pages/app/CuentasPorCobrarPage";
import PlanillasPage from "@/pages/app/PlanillasPage";
import UsuariosPage from "@/pages/app/UsuariosPage";
import InboxPage from "@/pages/inbox/InboxPage";

const queryClient = new QueryClient();

const placeholderRoutes = [
  "parametros",
];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              <Route path="/app" element={<AppShell />}>
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
