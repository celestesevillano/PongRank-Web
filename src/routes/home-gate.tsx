import { Navigate } from 'react-router-dom';

import { Spinner } from '@/components/common/spinner';
import { useSession } from '@/context/session';
import WelcomePage from '@/pages/welcome';

export function HomeGate() {
  const { isAuthenticated, isLoading, onboardingPending } = useSession();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!isAuthenticated) return <WelcomePage />;
  return <Navigate to={onboardingPending ? '/register/community' : '/home'} replace />;
}
