import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { PrivateRoute, PublicOnlyRoute } from '@/components/common/private-route';
import { AppLayout } from '@/components/layout/app-layout';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const RankingPage = lazy(() => import('@/pages/ranking'));
const MatchesPage = lazy(() => import('@/pages/matches'));
const MatchDetailPage = lazy(() => import('@/pages/match-detail'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

const withSuspense = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/register', element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/ranking', element: <RankingPage /> },
          { path: '/matches', element: <MatchesPage /> },
          { path: '/matches/:id', element: <MatchDetailPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
