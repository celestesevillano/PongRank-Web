import { Target, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ButtonLink } from '@/components/ui/button-link';
import { BrandImages } from '@/lib/brand';
import { paths } from '@/routes/paths';

const INTRO_DURATION_MS = 2190;
const PLAYED_KEY = 'pongrank.intro-played';

const FEATURES = [
  { Icon: Users, label: 'Compite en tu comunidad' },
  { Icon: TrendingUp, label: 'Mejora tu ranking' },
  { Icon: Target, label: 'Reta a jugadores de tu nivel' },
];

const introAlreadyPlayed = () => {
  try {
    return sessionStorage.getItem(PLAYED_KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
};

export default function WelcomePage() {
  const [playing, setPlaying] = useState(() => !introAlreadyPlayed());

  useEffect(() => {
    if (!playing) return;
    try {
      sessionStorage.setItem(PLAYED_KEY, '1');
    } catch {
      // Sin almacenamiento la intro solo se repetirá en la próxima visita.
    }
    const timer = setTimeout(() => setPlaying(false), INTRO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [playing]);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between gap-6 px-4 py-10 ${playing ? '' : 'intro-static'}`}>
      <div className="flex flex-1 items-center justify-center">
        <div className="intro-stage" aria-hidden>
          <img src={BrandImages.emblem} alt="" className="intro-emblem" />
          {playing && (
            <>
              <img src={BrandImages.introPaddle} alt="" className="intro-paddle" />
              <img src={BrandImages.introBall} alt="" className="intro-ball" />
              <span className="intro-impact" />
            </>
          )}
        </div>
      </div>

      <div className="intro-brand flex w-full max-w-md flex-col items-center gap-2">
        <img src={BrandImages.wordmark} alt="PongRank" width={460} height={56} className="h-14 w-full object-contain" />
        <p className="text-xs tracking-[0.2em] text-muted">JUEGA. SUBE. COMPITE.</p>
      </div>

      <section className="intro-actions flex w-full max-w-md flex-col gap-6" inert={playing || undefined} aria-hidden={playing || undefined}>
        <h1 className="mt-4 text-center text-[26px] leading-tight font-bold">
          Encuentra tu
          <br />
          próximo rival
        </h1>
        <ul className="grid grid-cols-3 gap-2">
          {FEATURES.map(({ Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-1 text-center">
              <Icon aria-hidden className="size-7 text-brand" strokeWidth={1.8} />
              <span className="text-xs text-muted">{label}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <ButtonLink to={paths.login} variant="secondary" className="flex-1">
            Ya tengo cuenta
          </ButtonLink>
          <ButtonLink to={paths.register} className="flex-1">
            Empezar
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
