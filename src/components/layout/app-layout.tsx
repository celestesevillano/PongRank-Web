import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Spinner } from '@/components/common/spinner';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Navbar } from '@/components/layout/navbar';
import { PlanProvider } from '@/context/plan';

export function AppLayout() {
  return (
    <PlanProvider>
      <div className="min-h-screen">
        <Navbar />
        <Breadcrumbs />
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-24 sm:pb-6">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </PlanProvider>
  );
}
