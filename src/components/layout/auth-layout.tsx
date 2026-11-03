import type { PropsWithChildren } from 'react';

export function AuthLayout({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl font-extrabold">
          Pong<span className="text-brand">Rank</span>
        </h1>
        <h2 className="mt-6 text-2xl font-bold">{title}</h2>
        <p className="mb-6 text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
