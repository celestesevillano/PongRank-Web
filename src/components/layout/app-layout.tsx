import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Spinner } from '@/components/common/spinner';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Navbar } from '@/components/layout/navbar';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Breadcrumbs />
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
  );
}
