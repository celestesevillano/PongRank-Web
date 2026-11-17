import { ChevronLeft } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BrandImages } from '@/lib/brand';

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  backTo?: string;
  progress?: ReactNode;
}>;

export function AuthLayout({ title, subtitle, backTo, progress, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen justify-center px-4 py-6 sm:items-center">
      <div className="flex w-full max-w-md flex-col gap-4">
        {backTo && (
          <Link to={backTo} aria-label="Volver" className="-ml-2 self-start rounded-lg p-2 text-white transition hover:bg-white/5">
            <ChevronLeft aria-hidden className="size-7" />
          </Link>
        )}
        {progress}
        <img src={BrandImages.emblem} alt="" width={56} height={56} className="size-14 self-center" />
        <img src={BrandImages.wordmark} alt="PongRank" width={160} height={20} className="h-5 w-40 self-center object-contain" />
        <div className="text-center">
          <h1 className="text-[26px] leading-tight font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
