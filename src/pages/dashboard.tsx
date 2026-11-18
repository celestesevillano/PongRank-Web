import { Bot, ChartNoAxesColumnIncreasing, ChevronRight, Plus, RotateCw, Search, Trophy, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { CardLighting } from '@/components/common/card-lighting';
import { ShortcutBanner } from '@/components/home/shortcut-banner';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { BrandImages } from '@/lib/brand';
import { HomeArt } from '@/lib/plans';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { isRetryable } from '@/utils/api-error';
import { matchPerspective } from '@/utils/match-status';

const CYAN = '#22D3EE';
const RANKING_LOOKUP_SIZE = 100;
const RECENT_MATCHES = 3;

export default function DashboardPage() {
  const { player } = useSession();
  const { plan, openPlans } = usePlan();
  const navigate = useNavigate();
  const playerId = player!.id;
  const statisticsLocked = !plan || plan.plan === 'FREEMIUM';
  const firstName = player!.name.trim().split(/\s+/)[0] || 'jugador';

  const active = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);
  const rating = useFetch((signal) => authService.me(signal), [playerId]);
  const standing = useFetch(async (signal) => {
    const [community] = await communitiesService.mine(signal);
    if (!community) return null;
    const page = await communitiesService.ranking(community.id, { page: 0, size: RANKING_LOOKUP_SIZE }, signal);
    return { name: community.name, position: page.content.find((entry) => entry.playerId === playerId)?.position ?? null };
  }, [playerId]);
  const recent = useFetch((signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: RECENT_MATCHES, sort: 'lastConfirmed' }, signal), [playerId]);

  const currentRating = rating.data?.ratingGlicko ?? player!.ratingGlicko;
  const toReview = (active.data ?? []).filter((match) => matchPerspective(match, playerId).awaitingMyReview);
  const recentMatches = recent.data?.content ?? [];

  const hasActivity = recentMatches.length > 0 || Boolean(recent.error);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-[34px] leading-tight font-extrabold sm:text-5xl">
          Hola, <span className="text-accent">{firstName}</span>
        </h1>
        <div className="flex gap-2">
          <ButtonLink to={paths.newMatch} icon={Plus} className="min-h-12 flex-1 sm:min-w-48 sm:flex-none">
            Nueva partida
          </ButtonLink>
          <ButtonLink to={paths.findMatch} variant="secondary" icon={Search} className="min-h-12 flex-1 sm:min-w-48 sm:flex-none">
            Buscar partida
          </ButtonLink>
        </div>
      </div>

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

      <div className={`grid items-stretch gap-6 ${hasActivity ? 'lg:grid-cols-[1.7fr_1fr]' : ''}`}>
        <div className="flex flex-col gap-6">
          <section aria-label="Tu rating" className="relative overflow-hidden rounded-2xl border border-[#248997] bg-[#071C23] p-6 sm:p-8">
            <CardLighting color={CYAN} court />
            <img src={BrandImages.introBall} alt="" className="pointer-events-none absolute right-6 -bottom-2 size-20 opacity-70" />
            <div className="relative flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#C2C4CA]">RATING ACTUAL</p>
                <p className="text-6xl font-black tabular-nums sm:text-7xl">{Math.round(currentRating)}</p>
              </div>
              {standing.data?.position != null && (
                <div className="max-w-[48%] p-2 sm:mr-24">
                  <p className="text-lg font-extrabold text-[#C2C4CA] tabular-nums">Puesto #{standing.data.position}</p>
                  <p className="line-clamp-2 text-sm text-[#B8BDC3]">{standing.data.name}</p>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-h-36">
            <ShortcutBanner
              title="Estadísticas"
              subtitle={statisticsLocked ? 'Requiere Básico' : 'Tu progreso'}
              locked={statisticsLocked}
              Icon={ChartNoAxesColumnIncreasing}
              artwork={HomeArt.statistics}
              onClick={() => (statisticsLocked ? openPlans() : navigate(paths.statistics))}
            />
            <ShortcutBanner title="Coach" subtitle="Solo en la app" locked Icon={Bot} artwork={HomeArt.coach} coach />
          </div>
        </div>

        {hasActivity && (
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5" aria-labelledby="activity-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="activity-title" className="text-lg font-extrabold">
                Tu actividad
              </h2>
              <Link to={paths.matches} className="flex min-h-11 items-center gap-1 font-bold text-accent">
                Ver partidas <ChevronRight aria-hidden className="size-4" />
              </Link>
            </div>
            {recent.error ? (
              <div className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-black p-3">
                <p className="text-[15px] text-muted">{recent.error.message}</p>
                {isRetryable(recent.error) && (
                  <Button variant="secondary" icon={RotateCw} onClick={recent.refetch}>
                    Reintentar
                  </Button>
                )}
              </div>
            ) : (
              recentMatches.map((match) => <ActivityTile key={match.id} match={match} playerId={playerId} />)
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ActivityTile({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const isPlayer1 = match.player1.id === playerId;
  const rival = isPlayer1 ? match.player2 : match.player1;
  const won = match.winnerId === playerId;
  const delta = isPlayer1 ? match.ratingDeltaP1 : match.ratingDeltaP2;
  const points = delta != null ? Math.round(delta) : null;
  const Icon = won ? Trophy : X;

  return (
    <Link
      to={paths.matchDetail(match.id)}
      className={`flex min-h-12 items-center gap-2 rounded-[14px] border px-4 py-2 transition hover:brightness-125 ${won ? 'border-[#344047] bg-[#101519]' : 'border-[#71333C] bg-[#241419]'}`}
    >
      <span className={`rounded-lg p-2 ${won ? 'bg-[#10333C]' : 'bg-[#472129]'}`}>
        <Icon aria-hidden className={`size-4.5 ${won ? 'text-accent' : 'text-[#FF8990]'}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-extrabold ${won ? 'text-accent' : 'text-[#FF8990]'}`}>{won ? 'Victoria' : 'Derrota'}</span>
        <span className="block truncate text-[13px] text-[#B8BDC3]">
          {rival?.name ?? 'Rival'}
          {match.scoreSummary ? ` · ${match.scoreSummary}` : ''}
        </span>
      </span>
      {points !== null && (
        <span className={`shrink-0 font-extrabold tabular-nums ${points < 0 ? 'text-[#FF8990]' : 'text-accent'}`}>
          {points > 0 ? '+' : ''}
          {points} pts
        </span>
      )}
    </Link>
  );
}
