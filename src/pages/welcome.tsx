import { Link } from 'react-router-dom';
import { Bot, ChartNoAxesCombined, Check, Shield, Swords, Trophy, Users, type LucideIcon } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button-link';
import { BrandImages } from '@/lib/brand';
import { PAID_PLANS, PLAN_ART, PLAN_LABEL, planBenefits } from '@/lib/plans';
import { paths } from '@/routes/paths';
import type { MembershipPlan } from '@/types/api';
import './welcome.css';

const FEATURES: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Trophy, title: 'Ranking real', text: 'Tu rating sube o baja con cada partida confirmada.' },
  { Icon: Users, title: 'Comunidades y clubes', text: 'Juega con tu universidad, tu club o tus Pongmigos.' },
  { Icon: Swords, title: 'Partidas en 4 pasos', text: 'Crea, encuentra rival, juega y confirma el resultado.' },
];

const PLAN_CARDS: { plan: MembershipPlan; price: string; recommended?: boolean }[] = [
  { plan: 'FREEMIUM', price: 'Gratis' },
  ...PAID_PLANS.map(({ plan, price, recommended }) => ({ plan, price: `${price} al mes`, recommended })),
];

/** Halo de luz difuminado: solo rojo de marca o celeste de acento, siempre localizado. */
function Halo({ color, className }: { color: 'red' | 'cyan'; className: string }) {
  const tone = color === 'red' ? 'rgba(232,38,47,0.35)' : 'rgba(34,211,238,0.22)';
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${className}`}
      style={{ background: `radial-gradient(closest-side, ${tone}, transparent)` }}
    />
  );
}

export default function WelcomePage() {
  return (
    <div className="isolate min-h-screen overflow-x-hidden bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-line bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <img src={BrandImages.wordmark} alt="PongRank" className="h-6" />
          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm font-bold text-muted md:flex">
            <a href="#planes" className="hover:text-white">Planes</a>
            <a href="#coach" className="hover:text-white">Coach</a>
            <a href="#clubes" className="hover:text-white">Clubes y torneos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={paths.login} className="inline-flex min-h-11 items-center px-3 text-sm font-bold text-muted hover:text-white">Iniciar sesión</Link>
            <ButtonLink to={paths.register}>Crear cuenta</ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-28 px-5 py-16 sm:px-8 sm:py-24">
        {/* Hero */}
        <section className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Halo color="red" className="-top-24 -left-24 size-[28rem]" />
          <Halo color="cyan" className="right-0 -bottom-24 size-96" />
          <div className="rise flex max-w-xl flex-col items-start gap-5">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-extrabold tracking-wider text-accent uppercase">Tenis de mesa competitivo</span>
            <h1 className="text-4xl leading-[1.1] font-black italic sm:text-5xl lg:text-6xl">El ranking de tenis de mesa de tu comunidad</h1>
            <p className="text-lg text-muted">PongRank une partidas, ranking y Pongmigos en un solo lugar. Juega, confirma el resultado y mira cómo cambia tu rating.</p>
            <ButtonLink to={paths.register} className="mt-1 w-full sm:w-auto sm:min-w-56">Empezar gratis</ButtonLink>
          </div>
          <div className="flex justify-center">
            <img src="/illustrations/landing/landing-hero.webp" alt="Pongi y Ranky jugando una partida de tenis de mesa" className="float w-full max-w-xl drop-shadow-[0_0_60px_rgba(232,38,47,0.3)]" />
          </div>
        </section>

        {/* Qué es */}
        <section className="rise grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <article key={title} className="lift rounded-2xl border border-line bg-surface p-6">
              <Icon className="mb-4 size-8 text-accent" strokeWidth={1.75} aria-hidden />
              <h2 className="text-lg font-extrabold">{title}</h2>
              <p className="mt-1 text-muted">{text}</p>
            </article>
          ))}
        </section>

        {/* Comunidad */}
        <section className="relative grid items-center gap-10 lg:grid-cols-2">
          <Halo color="cyan" className="top-0 left-0 size-96" />
          <div className="flex justify-center">
            <img src="/illustrations/landing/landing-comunidades.webp" alt="Cuatro amigos revisando el ranking de su grupo junto a una mesa" className="float w-full max-w-xs" loading="lazy" />
          </div>
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-3xl font-black sm:text-4xl">Encuentra con quién jugar</h2>
            <p className="text-muted">Únete a comunidades y clubes, agrega Pongmigos y mira tu posición en el ranking de tu grupo. PongRank te conecta con jugadores reales de tenis de mesa.</p>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="relative flex scroll-mt-24 flex-col gap-10">
          <Halo color="red" className="top-1/3 left-1/2 size-[32rem] -translate-x-1/2" />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Elige tu plan</h2>
            <p className="mt-3 text-muted">Los espacios son un solo cupo: cada comunidad o club, creado o al que te unes, usa 1 espacio.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_CARDS.map(({ plan, price, recommended }) => {
              const art = plan === 'FREEMIUM' ? undefined : PLAN_ART[plan as keyof typeof PLAN_ART];
              return (
                <article
                  key={plan}
                  className={`lift flex flex-col gap-4 rounded-2xl border bg-surface p-5 ${recommended ? 'border-brand shadow-[0_0_40px_rgba(232,38,47,0.18)]' : 'border-line'}`}
                >
                  {art ? (
                    <img src={art.image} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[3/2] w-full items-center justify-center rounded-xl border border-line bg-black">
                      <img src="/illustrations/landing/landing-plan-free.webp" alt="" className="size-full rounded-xl object-cover" loading="lazy" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black">{PLAN_LABEL[plan]}</h3>
                      {recommended && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold">Recomendado</span>}
                    </div>
                    <p className="mt-1 text-2xl font-black">{price}</p>
                  </div>
                  <ul className="flex flex-col gap-2 text-sm text-muted">
                    {planBenefits(plan).map(({ title }) => (
                      <li key={title} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span>{title}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {/* Coach (Pro) */}
        <section id="coach" className="relative isolate grid scroll-mt-24 items-center gap-10 overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-12 lg:grid-cols-2">
          <Halo color="cyan" className="top-0 right-0 size-96" />
          <div className="flex flex-col items-start gap-4">
            <span className="flex items-center gap-2 text-sm font-bold text-accent"><Bot className="size-4" aria-hidden />Plan Pro</span>
            <h2 className="text-3xl font-black sm:text-4xl">Coach Pongi analiza tu postura</h2>
            <p className="text-muted">Con la cámara de tu celular, Pongi revisa tu postura y movimiento mientras entrenas y te dice qué mejorar. Disponible en la app móvil para Pro y Enterprise.</p>
            <ul className="flex flex-col gap-2 text-muted">
              <li className="flex items-center gap-2"><ChartNoAxesCombined className="size-4 text-accent" aria-hidden />Estadísticas de tu progreso</li>
              <li className="flex items-center gap-2"><Bot className="size-4 text-accent" aria-hidden />Sesiones guardadas en tu historial</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <img src="/illustrations/landing/landing-coach.webp" alt="" className="float max-h-56 w-auto object-contain" loading="lazy" />
          </div>
        </section>

        {/* Clubes y torneos (Enterprise) */}
        <section id="clubes" className="relative grid scroll-mt-24 items-center gap-10 lg:grid-cols-2">
          <Halo color="red" className="bottom-0 left-0 size-96" />
          <div className="order-2 flex justify-center lg:order-1">
            <img src="/illustrations/landing/landing-torneos.webp" alt="" className="float max-h-60 w-auto object-contain" loading="lazy" />
          </div>
          <div className="order-1 flex flex-col items-start gap-4 lg:order-2">
            <span className="flex items-center gap-2 text-sm font-bold text-brand"><Shield className="size-4" aria-hidden />Plan Enterprise</span>
            <h2 className="text-3xl font-black sm:text-4xl">Tu club y tus torneos</h2>
            <p className="text-muted">Registra tu club, administra a tus socios y organiza torneos con cuadro de eliminación. Tu club propio cuenta como 1 de tus 6 espacios.</p>
          </div>
        </section>

        {/* Cierre */}
        <section className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center">
          <Halo color="red" className="top-0 left-1/2 size-80 -translate-x-1/2 -translate-y-1/3" />
          <h2 className="text-3xl font-black">¿Listo para subir en el ranking?</h2>
          <ButtonLink to={paths.register}>Empezar gratis</ButtonLink>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-faint">PongRank · Proyecto UTEC CS 2031</footer>
    </div>
  );
}
