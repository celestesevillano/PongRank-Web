import type { ReactNode } from 'react';

type MatchStateProps = { title: string; message?: string; art?: string; children?: ReactNode };

export function MatchState({ title, message, art, children }: MatchStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 text-center">
      {art && <img src={art} alt="" width={148} height={148} className="size-37" />}
      <h2 className="text-2xl font-extrabold">{title}</h2>
      {message && <p className="max-w-72 leading-5 text-muted">{message}</p>}
      {children}
    </div>
  );
}
