import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/auth/AuthContext';
import { demoUsers, roleLabels } from '../../services/auth';

function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <main className="login-page"><p>Verificando sesión...</p></main>;
  if (user) return <Navigate to="/panel" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error || 'No se pudo iniciar sesión.');
      setSubmitting(false);
      return;
    }
    const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(requestedPath || '/panel', { replace: true });
  };

  const useDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img src="/logo.svg" alt="A&F Homologación" />
          <h1>Bienvenido</h1>
          <p>Ingresa a la plataforma de homologación de proveedores.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="form-field" htmlFor="email">
            Correo electrónico
            <input id="email" type="email" autoComplete="username" placeholder="usuario@af.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="form-field" htmlFor="password">
            Contraseña
            <span className="password-field">
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </span>
          </label>

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="btn-primary login-submit" disabled={!email || !password || submitting}>{submitting ? 'Ingresando...' : 'Ingresar'}</button>
        </form>

        <div className="demo-accounts">
          <p>Accesos de demostración</p>
          {demoUsers.map((demoUser) => (
            <button key={demoUser.id} type="button" onClick={() => useDemoAccount(demoUser.email, demoUser.password)}>
              <span>{roleLabels[demoUser.role]}</span>
              <small>{demoUser.email}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
