import { ChevronRight, Plus, RotateCw, Search, Trophy, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CardLighting } from '@/components/common/card-lighting';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { BrandImages } from '@/lib/brand';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { isRetryable } from '@/utils/api-error';

const CYAN = '#22D3EE';
const RANKING_LOOKUP_SIZE = 100;
const RECENT_MATCHES = 3;

export default function DashboardPage() {
  const { player } = useSession();
  const playerId = player!.id;
  const firstName = player!.name.trim().split(/\s+/)[0] || 'jugador';

  const rating = useFetch((signal) => authService.me(signal), [playerId]);
  const standing = useFetch(async (signal) => {
    const [community] = await communitiesService.mine(signal);
    if (!community) return null;
    const page = await communitiesService.ranking(community.id, { page: 0, size: RANKING_LOOKUP_SIZE }, signal);
    return { name: community.name, position: page.content.find((entry) => entry.playerId === playerId)?.position ?? null };
  }, [playerId]);
  const recent = useFetch((signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: RECENT_MATCHES, sort: 'lastConfirmed' }, signal), [playerId]);

  const currentRating = rating.data?.ratingGlicko ?? player!.ratingGlicko;
  const recentMatches = recent.data?.content ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-[34px] leading-tight font-extrabold">
        Hola, <span className="text-accent">{firstName}</span>
      </h1>

      <section aria-label="Tu rating" className="relative overflow-hidden rounded-2xl border border-[#248997] bg-[#071C23] p-4">
        <CardLighting color={CYAN} court />
        <img src={BrandImages.introBall} alt="" className="pointer-events-none absolute right-4 -bottom-2 size-14.5 opacity-70" />
        <div className="relative flex flex-wrap items-start gap-2">
          <div className="flex-1">
            <p className="text-xs font-bold text-[#C2C4CA]">RATING ACTUAL</p>
            <p className="text-5xl font-black tabular-nums">{Math.round(currentRating)}</p>
          </div>
          {standing.data?.position != null && (
            <div className="max-w-[48%] p-2">
              <p className="text-xs font-bold text-[#C2C4CA] tabular-nums">Puesto #{standing.data.position}</p>
              <p className="line-clamp-2 text-[13px] text-[#B8BDC3]">{standing.data.name}</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-2">
        <ButtonLink to={paths.newMatch} icon={Plus} className="min-h-12 flex-1">
          Nueva partida
        </ButtonLink>
        <ButtonLink to={paths.findMatch} variant="secondary" icon={Search} className="min-h-12 flex-1">
          Buscar partida
        </ButtonLink>
      </div>

      {(recentMatches.length > 0 || recent.error) && (
        <section className="flex flex-col gap-2" aria-labelledby="activity-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="activity-title" className="text-lg font-extrabold">
              Tu actividad
            </h2>
            <Link to={paths.matches} className="flex min-h-11 items-center gap-1 font-bold text-accent">
              Ver partidas <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
          {recent.error ? (
            <div className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-surface p-3">
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
