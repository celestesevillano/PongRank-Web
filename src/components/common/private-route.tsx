import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '@/components/common/spinner';
import { useSession } from '@/context/session';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useSession();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}
