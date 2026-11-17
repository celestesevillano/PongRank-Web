import { Navigate, Outlet } from 'react-router-dom';

import { useSession } from '@/context/session';
import { paths } from '@/routes/paths';

export const isSystemAdmin = (role?: string) => role === 'ROLE_SYSTEM_ADMIN';

export function AdminRoute() {
  const { player } = useSession();
  return isSystemAdmin(player?.role) ? <Outlet /> : <Navigate to={paths.home} replace />;
}
