import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../../providers/AuthProvider';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, needsUsername } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (needsUsername) {
    return <Navigate to="/setup-username" replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
