import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <div className="container">
      <section className="card" style={{ maxWidth: 620, margin: '3rem auto', textAlign: 'center' }}>
        <p className="role-badge" style={{ display: 'inline-block' }}>Acceso restringido</p>
        <h2 className="page-title">No tienes permiso para ingresar a esta sección</h2>
        <p className="secondary-text">Tu cuenta no incluye esta función. Si la necesitas, comunícate con un supervisor.</p>
        <Link className="btn-primary inline-button" to="/panel">Volver al panel</Link>
      </section>
    </div>
  );
}

export default UnauthorizedPage;
