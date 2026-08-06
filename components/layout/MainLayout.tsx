import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/auth/AuthContext';
import { roleLabels, routeRoles } from '../../services/auth';

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Información de Proveedores', path: '/proveedores' },
  { label: 'Homologaciones', path: '/homologaciones' },
  { label: 'Empresas Homologadas', path: '/homologadas' },
  { label: 'Reportes', path: '/reportes' },
  { label: 'Configuración', path: '/configuracion' },
  { label: 'Perfil', path: '/profile' },
];

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const visibleMenuItems = menuItems.filter((item) => routeRoles[item.path].includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.svg" alt="A&F Homologación" />
          <p>Plataforma de homologación</p>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {visibleMenuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-content">
        <header className="app-header">
          <div>
            <h1 className="page-title">Sistema de Homologación</h1>
            <p className="secondary-text">Panel de proveedores y homologaciones.</p>
          </div>
          <div className="user-menu">
            <div><strong>{user.name}</strong><span>{roleLabels[user.role]}</span></div>
            <button type="button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
