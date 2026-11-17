import { Bot, ChartNoAxesColumnIncreasing, ChevronRight, LockKeyhole, Plus, Search, Trophy, X } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { ButtonLink } from '@/components/ui/button-link';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { paths } from '@/routes/paths';
import { matchesService } from '@/services/matches.service';
import { matchPerspective } from '@/utils/match-status';

export default function DashboardPage() {
  const { player } = useSession();
  const playerId = player!.id;
  const firstName = player!.name.trim().split(/\s+/)[0] || 'jugador';

  const active = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);
  const standing = useFetch(async (signal) => {
    const [community] = await communitiesService.mine(signal);
    if (!community) return null;
    const page = await communitiesService.ranking(community.id, { page: 0, size: 100 }, signal);
    return { name: community.name, position: page.content.find((entry) => entry.playerId === playerId)?.position };
  }, [playerId]);
  const recent = useFetch(
    (signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: 3, sort: 'newest' }, signal),
    [playerId],
  );

  const toReview = (active.data ?? []).filter((match) => matchPerspective(match, playerId).awaitingMyReview);
  const recentMatches = recent.data?.content ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <img src="/brand/pongrank-wordmark.webp" alt="PongRank" className="h-5 w-auto self-start" />
        <h1 className="text-3xl font-extrabold md:text-4xl">
          Hola, <span className="text-accent">{firstName}</span>
        </h1>
      </header>

      {toReview.length > 0 && (
        <Link
          to={paths.matchDetail(toReview[0].id)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-brand/60 bg-brand/10 px-4 py-3 transition hover:bg-brand/20"
        >
          <span className="text-sm">
            <strong>{toReview.length === 1 ? 'Tienes un resultado por confirmar' : `Tienes ${toReview.length} resultados por confirmar`}</strong>
            <span className="text-muted"> · Tu rival ya registró el marcador.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent">
            Revisar <ChevronRight aria-hidden className="size-4" />
          </span>
        </Link>
      )}

      <section className="relative overflow-hidden rounded-2xl border border-[#248997] bg-[#071C23] p-5 md:p-6">
        <img src="/brand/pongrank-intro-ball.webp" alt="" className="pointer-events-none absolute right-4 bottom-0 h-16 w-16 opacity-70 md:h-20 md:w-20" />
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <p className="text-xs font-bold tracking-wide text-[#C2C4CA]">RATING ACTUAL</p>
            <p className="text-5xl font-black tabular-nums md:text-6xl">{Math.round(player!.ratingGlicko)}</p>
          </div>
          {standing.data?.position != null && (
            <div className="max-w-xs">
              <p className="text-xs font-bold text-[#C2C4CA]">Puesto #{standing.data.position}</p>
              <p className="text-sm text-muted">{standing.data.name}</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <ButtonLink to={paths.newMatch} icon={Plus}>Nueva partida</ButtonLink>
        <ButtonLink to={paths.findMatch} variant="secondary" icon={Search}>Buscar partida</ButtonLink>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Shortcut
          title="Estadísticas"
          subtitle="Tu progreso"
          href="/profile"
          icon={<ChartNoAxesColumnIncreasing className="size-5 text-accent" />}
          art="/illustrations/pongrank-home-statistics.webp"
        />
        <Shortcut
          title="Coach"
          subtitle="Úsalo desde la app móvil"
          locked
          icon={<Bot className="size-5 text-[#FF8990]" />}
          art="/illustrations/pongrank-home-coach.webp"
          accent="red"
        />
      </div>

      {(recentMatches.length > 0 || recent.error) && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tu actividad</h2>
            <Link to={paths.matches} className="inline-flex items-center gap-1 text-sm font-bold text-accent">
              Ver partidas <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ScreenState {...recent} onRetry={recent.refetch} isEmpty={() => false}>
            {() => (
              <div className="flex flex-col gap-2">
                {recentMatches.map((item) => {
                  const isPlayer1 = item.player1.id === playerId;
                  const rival = isPlayer1 ? item.player2 : item.player1;
                  const won = item.winnerId === playerId;
                  const delta = isPlayer1 ? item.ratingDeltaP1 : item.ratingDeltaP2;
                  const value = delta != null ? Math.round(delta) : null;
                  const color = won ? 'text-accent' : 'text-[#FF8990]';
                  return (
                    <Link
                      key={item.id}
                      to={paths.matchDetail(item.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:border-line ${won ? 'border-[#2A535D] bg-[#101F25]' : 'border-[#71333C] bg-[#241419]'}`}
                    >
                      <span className={`flex size-9 items-center justify-center rounded-full ${won ? 'bg-[#122A1E]' : 'bg-[#3A1A1E]'}`}>
                        {won ? <Trophy className="size-4 text-accent" /> : <X className="size-4 text-[#FF8990]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-bold ${color}`}>{won ? 'Victoria' : 'Derrota'}</span>
                        <span className="block truncate text-sm text-muted">{rival?.name ?? 'Rival'}{item.scoreSummary ? ` · ${item.scoreSummary}` : ''}</span>
                      </span>
                      {value != null && (
                        <span className={`font-bold tabular-nums ${value < 0 ? 'text-[#FF8990]' : 'text-accent'}`}>
                          {value > 0 ? '+' : ''}{value} pts
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </ScreenState>
        </section>
      )}
    </div>
  );
}

function Shortcut({ title, subtitle, icon, art, href, locked = false, accent = 'cyan' }: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  art: string;
  href?: string;
  locked?: boolean;
  accent?: 'cyan' | 'red';
}) {
  const className = `relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border p-4 ${accent === 'red' ? 'border-[#71333C] bg-[#1A1012]' : 'border-[#2A535D] bg-[#0B1A1E]'}`;
  const content = (
    <>
      <img src={art} alt="" className="pointer-events-none absolute right-0 bottom-0 h-full w-1/2 object-contain object-right-bottom opacity-90" />
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-full bg-black/40">{icon}</span>
        {!locked && <ChevronRight className={`size-4 ${accent === 'red' ? 'text-[#FF8990]' : 'text-accent'}`} />}
      </div>
      <div className="relative">
        <p className="font-bold">{title}</p>
        {locked ? (
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${accent === 'red' ? 'bg-[#3A1A1E] text-[#FFBCC0]' : 'bg-[#122A1E] text-[#A5F3FC]'}`}>
            <LockKeyhole className="size-3" /> {subtitle}
          </span>
        ) : (
          <p className="text-sm text-muted">{subtitle}</p>
        )}
      </div>
    </>
  );
  return href && !locked ? <Link to={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}
