import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../app/login/LoginPage';
import DashboardPage from '../app/dashboard/DashboardPage';
import ProveedoresPage from '../app/proveedores/ProveedoresPage';
import HomologacionesPage from '../app/homologaciones/HomologacionesPage';
import HomologadasPage from '../app/homologadas/HomologadasPage';
import ReportesPage from '../app/reportes/ReportesPage';
import ConfiguracionPage from '../app/configuracion/ConfiguracionPage';
import UnauthorizedPage from '../app/unauthorized/UnauthorizedPage';
import ProtectedRoute from './auth/ProtectedRoute';
import LandingPage from '../app/landing/LandingPage';
import CarterasPage from '../app/carteras/CarterasPage';
import MiCarteraPage from '../app/mi-cartera/MiCarteraPage';
import { features } from '../services/features';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/panel" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="homologaciones" element={features.providerStatusTab ? <HomologacionesPage /> : <Navigate to="/panel" replace />} />
          <Route element={<ProtectedRoute allowedRoles={['ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector']} />}>
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="homologadas" element={<HomologadasPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['supervisor_general', 'administradora']} />}>
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="carteras" element={<CarterasPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ejecutiva']} />}>
            <Route path="mi-cartera" element={<MiCarteraPage />} />
          </Route>
          <Route path="sin-permiso" element={<UnauthorizedPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
