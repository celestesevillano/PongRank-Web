import type { ReactNode } from 'react';

import { MatchArt } from '@/lib/match-art';

type MatchBannerProps = { title: string; children?: ReactNode; prominent?: boolean };

export function MatchBanner({ title, children, prominent = false }: MatchBannerProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${prominent ? 'min-h-34 border-[#71313B] p-4' : 'min-h-27 border-[#733440] bg-[#291017] p-3.5'}`}
      style={prominent ? { background: 'radial-gradient(ellipse 100% 75% at 100% 50%, #65202C 0%, #211014 64%, #130B0D 100%)' } : undefined}
    >
      <img src={MatchArt.banner} alt="" className={`pointer-events-none absolute right-0 object-cover object-right ${prominent ? '-top-1/4 h-[148%] aspect-[3/2]' : 'top-0 h-full w-[52%]'}`} />
      {prominent && <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, #130B0D 35%, transparent 65%)' }} />}
      <div className={`relative flex flex-col justify-center ${prominent ? 'min-h-26 w-[72%] gap-1.5' : 'w-[69%] gap-1'}`}>
        <h1 className={`font-extrabold ${prominent ? 'text-[29px] leading-tight sm:text-[34px]' : 'text-[23px]'}`}>{title}</h1>
        {children}
      </div>
    </section>
  );
}
