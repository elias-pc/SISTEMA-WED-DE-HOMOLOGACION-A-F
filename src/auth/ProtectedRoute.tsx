import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types';
import { useAuth } from './AuthContext';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/sin-permiso" replace />;
  return <Outlet />;
}

export default ProtectedRoute;
