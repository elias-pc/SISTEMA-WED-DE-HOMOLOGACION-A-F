import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../app/login/LoginPage';
import DashboardPage from '../app/dashboard/DashboardPage';
import ProveedoresPage from '../app/proveedores/ProveedoresPage';
import HomologacionesPage from '../app/homologaciones/HomologacionesPage';
import HomologadasPage from '../app/homologadas/HomologadasPage';
import ReportesPage from '../app/reportes/ReportesPage';
import ConfiguracionPage from '../app/configuracion/ConfiguracionPage';
import ProfilePage from '../app/profile/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="homologaciones" element={<HomologacionesPage />} />
        <Route path="homologadas" element={<HomologadasPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
