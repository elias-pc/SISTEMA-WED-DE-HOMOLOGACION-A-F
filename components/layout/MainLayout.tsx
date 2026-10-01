import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/auth/AuthContext';
import { useTenant } from '../../src/tenant/TenantContext';
import { roleLabels, routeRoles } from '../../services/auth';
import { features } from '../../services/features';

const menuItems: Array<{ label: string; path: string; hidden?: boolean }> = [
  { label: 'Dashboard', path: '/panel' }, { label: 'Información de proveedores', path: '/panel/proveedores' },
  { label: 'Mi cartera', path: '/panel/mi-cartera' },
  { label: 'Estatus de proveedores', path: '/panel/homologaciones', hidden: !features.providerStatusTab },
  { label: 'Cartera de ejecutivas', path: '/panel/carteras' }, { label: 'Reportes', path: '/panel/reportes' }, { label: 'Empresas y procesos', path: '/panel/configuracion' },
];

function MainLayout() {
  const { user, logout } = useAuth();
  const { empresasDisponibles, procesos, selectedEmpresa, selectedProceso, selectEmpresa, selectProceso } = useTenant();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;
  const visibleMenuItems = menuItems.filter((item) => !item.hidden && routeRoles[item.path.replace('/panel', '') || '/'].includes(user.role));
  const procesosEmpresa = procesos.filter((item) => item.empresaId === selectedEmpresa?.id);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="app-shell">
      <button type="button" className="sidebar-reveal-zone" aria-label="Mostrar menú lateral" aria-controls="main-sidebar" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span aria-hidden="true">›</span></button>
      <aside id="main-sidebar" className={`sidebar${menuOpen ? ' is-open' : ''}`}>
        <button type="button" className="sidebar-close" aria-label="Contraer menú lateral" onClick={() => setMenuOpen(false)}>×</button>
        <div className="sidebar-brand"><img src="/logo.svg" alt="A&F Homologación" /><p>Plataforma de homologación</p></div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {visibleMenuItems.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/panel'} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{item.label}</NavLink>)}
        </nav>
      </aside>
      <main className="app-content">
        <header className="app-header">
          <div className="app-header-brand"><h1 className="page-title">Sistema de Homologación</h1><p className="secondary-text">Panel de proveedores y homologaciones.</p></div>
          <div className="header-context-chip" aria-label="Sección principal">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m2.5 8.5 7.5-6 7.5 6v8a1 1 0 0 1-1 1h-4.25v-5.25h-4.5v5.25H3.5a1 1 0 0 1-1-1z" /></svg>
            <span>Panel</span>
          </div>
          <div className="user-menu">
            <div className="user-identity">
              <span className="user-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span>
              <span className="user-copy"><strong>{user.name}</strong><span>{roleLabels[user.role]}</span></span>
            </div>
            <button type="button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </header>
        <section className="tenant-bar tenant-bar-compact" aria-label="Contexto de trabajo">
            <label>Empresa
              <select value={selectedEmpresa?.id || ''} onChange={(event) => selectEmpresa(event.target.value)}>
                {empresasDisponibles.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nombreComercial}</option>)}
              </select>
            </label>
            <label>Proceso
              <select value={selectedProceso?.id || ''} onChange={(event) => selectProceso(event.target.value)}>
                {procesosEmpresa.map((proceso) => <option key={proceso.id} value={proceso.id}>{proceso.codigo} · {proceso.estado}</option>)}
              </select>
            </label>
        </section>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
