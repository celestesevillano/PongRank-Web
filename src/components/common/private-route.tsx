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

  if (isAuthenticated) return <Outlet />;
  return location.pathname === '/' ? <Navigate to="/welcome" replace /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, onboardingPending } = useSession();
  if (isLoading) return null;
  if (!isAuthenticated) return <Outlet />;
  return <Navigate to={onboardingPending ? '/register/community' : '/'} replace />;
}
