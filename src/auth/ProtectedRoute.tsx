import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types';
import { useAuth } from './AuthContext';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="login-page"><p className="secondary-text">Verificando sesión...</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/sin-permiso" replace />;
  return <Outlet />;
}

export default ProtectedRoute;
