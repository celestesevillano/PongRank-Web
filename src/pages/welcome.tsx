import { Link } from 'react-router-dom';
import { Swords, Trophy, Users } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button-link';
import { BrandImages } from '@/lib/brand';
import { paths } from '@/routes/paths';

const FEATURES = [
  { Icon: Trophy, title: 'Ranking real', text: 'Tu rating sube o baja con cada partida confirmada.' },
  { Icon: Users, title: 'Comunidades y clubes', text: 'Juega con tu universidad, tu club o tus Pongmigos.' },
  { Icon: Swords, title: 'Partidas en 4 pasos', text: 'Crea, encuentra rival, juega y confirma el resultado.' },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-line bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <img src={BrandImages.wordmark} alt="PongRank" className="h-6" />
          <div className="flex items-center gap-+2">
            <Link to={paths.login} className="px-3 py-2 text-sm font-bold text-muted hover:text-white">Iniciar sesión</Link>
            <ButtonLink to={paths.register}>Crear cuenta</ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <img src={BrandImages.introPaddle} alt="" className="h-24" />
          <h1 className="max-w-2xl text-4xl font-black italic sm:text-5xl">El ranking de tenis de mesa de tu comunidad</h1>
          <p className="max-w-xl text-lg text-muted">PongRank une partidas, ranking y amigos en un solo lugar. Juega, confirma el resultado y mira cómo cambia tu rating.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-line bg-surface p-5">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand"><Icon className="size-5" /></span>
              <h2 className="font-extrabold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 rounded-3xl border border-[#24616A] bg-[#081A20] p-8 text-center">
          <img src={BrandImages.wordmark} alt="" className="h-5" />
          <h2 className="text-2xl font-black">¿Listo para subir en el ranking?</h2>
          <ButtonLink to={paths.register}>Empezar gratis</ButtonLink>
        </section>
      </main>
    </div>
  );
}
