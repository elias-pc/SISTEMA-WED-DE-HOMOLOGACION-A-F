import { NavLink, Outlet } from 'react-router-dom';

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
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface-muted)' }}>
      <aside style={{ width: '260px', padding: '2rem 1.5rem', background: '#111827', color: '#fff' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <img src="/logo.svg" alt="A&F Homologación" style={{ maxWidth: '100%', height: 'auto', marginBottom: '1rem' }} />
          <p style={{ marginTop: '0.25rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
            Plataforma de homologación
          </p>
        </div>

        <nav style={{ display: 'grid', gap: '0.75rem' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.85rem 1rem',
                borderRadius: '0.85rem',
                color: isActive ? '#111827' : '#e5e7eb',
                background: isActive ? '#fff' : 'transparent',
                fontWeight: isActive ? 600 : 500,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        <header className="app-header">
          <div>
            <h1 className="page-title">Sistema de Homologación</h1>
            <p className="secondary-text">Panel administrativo para proveedores y homologaciones.</p>
          </div>
          <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
            Usuario A&F
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
