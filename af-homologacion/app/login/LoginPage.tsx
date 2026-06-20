import { Link } from 'react-router-dom';

function LoginPage() {
  return (
    <main className="container" style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section className="card" style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <img src="/logo.svg" alt="A&F Homologación" style={{ width: '220px', maxWidth: '100%', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Accede a la plataforma de homologación de proveedores.
          </p>
        </div>

        <form>
          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            Usuario
            <input
              type="text"
              placeholder="usuario@af.com"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '1rem' }}>
            Contraseña
            <input
              type="password"
              placeholder="********"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
              Recuperar contraseña
            </Link>
          </div>
          <button type="button" className="btn-primary" style={{ width: '100%', fontWeight: 600 }}>
            Ingresar
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
