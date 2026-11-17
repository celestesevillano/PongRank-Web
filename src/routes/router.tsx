import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminRoute } from '@/components/common/admin-route';
import { PrivateRoute, PublicOnlyRoute } from '@/components/common/private-route';
import { AppLayout } from '@/components/layout/app-layout';
import { RegistrationLayout } from '@/context/registration';

const WelcomePage = lazy(() => import('@/pages/welcome'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const RegisterAboutPage = lazy(() => import('@/pages/register-about'));
const RegisterLevelPage = lazy(() => import('@/pages/register-level'));
const RegisterCommunityPage = lazy(() => import('@/pages/register-community'));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));
const SocialPage = lazy(() => import('@/pages/social'));
const ExplorePage = lazy(() => import('@/pages/explore'));
const RegisterClubPage = lazy(() => import('@/pages/register-club'));
const CommunityDetailPage = lazy(() => import('@/pages/community-detail'));
const ClubDetailPage = lazy(() => import('@/pages/club-detail'));
const PublicPlayerPage = lazy(() => import('@/pages/public-player'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const RankingPage = lazy(() => import('@/pages/ranking'));
const MatchesPage = lazy(() => import('@/pages/matches'));
const TournamentsPage = lazy(() => import('@/pages/tournaments'));
const NewMatchPage = lazy(() => import('@/pages/new-match'));
const FindMatchPage = lazy(() => import('@/pages/find-match'));
const MatchDetailPage = lazy(() => import('@/pages/match-detail'));
const StatisticsPage = lazy(() => import('@/pages/statistics'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const ProfileSettingsPage = lazy(() => import('@/pages/profile-settings'));
const AdminPage = lazy(() => import('@/pages/admin'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

const withSuspense = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/welcome', element: withSuspense(<WelcomePage />) },
      { path: '/login', element: withSuspense(<LoginPage />) },
      {
        element: <RegistrationLayout />,
        children: [
          { path: '/register', element: withSuspense(<RegisterPage />) },
          { path: '/register/about', element: withSuspense(<RegisterAboutPage />) },
          { path: '/register/level', element: withSuspense(<RegisterLevelPage />) },
        ],
      },
      { path: '/forgot-password', element: withSuspense(<ForgotPasswordPage />) },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/register/community', element: withSuspense(<RegisterCommunityPage />) },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/social', element: withSuspense(<SocialPage />) },
          { path: '/social/explore', element: withSuspense(<ExplorePage />) },
          { path: '/social/register-club', element: withSuspense(<RegisterClubPage />) },
          { path: '/social/community/:id', element: withSuspense(<CommunityDetailPage />) },
          { path: '/social/club/:id', element: withSuspense(<ClubDetailPage />) },
          { path: '/social/player/:id', element: withSuspense(<PublicPlayerPage />) },
          { path: '/communities', element: <Navigate to="/social" replace /> },
          { path: '/ranking', element: <RankingPage /> },
          { path: '/matches', element: <MatchesPage /> },
          { path: '/matches/tournaments', element: withSuspense(<TournamentsPage />) },
          { path: '/matches/new', element: <NewMatchPage /> },
          { path: '/matches/find', element: <FindMatchPage /> },
          { path: '/matches/:id', element: <MatchDetailPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/settings', element: withSuspense(<ProfileSettingsPage />) },
          { element: <AdminRoute />, children: [{ path: '/admin', element: withSuspense(<AdminPage />) }] },
        ],
      },
    ],
  },
  { path: '/reset-password', element: withSuspense(<ResetPasswordPage />) },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
