import { ChevronRight, MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { paths } from '@/routes/paths';
import { matchesService } from '@/services/matches.service';
import { matchPerspective } from '@/utils/match-status';

export default function DashboardPage() {
  const { player } = useSession();
  const playerId = player!.id;

  const active = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);
  const community = useFetch(async (signal) => {
    const [first] = await communitiesService.mine(signal);
    if (!first) return null;
    return { community: first, ranking: await communitiesService.ranking(first.id, { page: 0, size: 5 }, signal) };
  }, [playerId]);

  const toReview = (active.data ?? []).filter((match) => matchPerspective(match, playerId).awaitingMyReview);
  const position = community.data?.ranking.content.find((entry) => entry.playerId === playerId)?.position;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Hola, {player!.name.split(' ')[0]}</h1>

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

      <div className="flex flex-wrap gap-2">
        <ButtonLink to={paths.newMatch} icon={Plus}>
          Crear partida
        </ButtonLink>
        <ButtonLink to={paths.findMatch} variant="secondary" icon={MapPin}>
          Buscar partida cercana
        </ButtonLink>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Rating" value={Math.round(player!.ratingGlicko)} />
        <StatCard label="Puesto en tu comunidad" value={position ? `#${position}` : '—'} />
        <StatCard label="Partidas activas" value={active.data?.length ?? '—'} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Top de tu comunidad</h2>
        <ScreenState
          {...community}
          onRetry={community.refetch}
          isEmpty={(data) => data === null}
          emptyMessage="Únete a una comunidad desde la app móvil para ver su ranking."
        >
          {(data) =>
            data && (
              <Card>
                <p className="mb-2 text-sm text-muted">{data.community.name}</p>
                <ol className="divide-y divide-line">
                  {data.ranking.content.map((entry) => (
                    <li key={entry.playerId} className="flex justify-between py-2">
                      <span>
                        <span className="mr-3 font-bold text-brand">#{entry.position}</span>
                        {entry.playerName}
                      </span>
                      <span className="font-bold">{Math.round(entry.ratingGlicko)}</span>
                    </li>
                  ))}
                </ol>
                <Link to="/ranking" className="mt-3 inline-block text-sm font-bold text-brand">
                  Ver ranking completo →
                </Link>
              </Card>
            )
          }
        </ScreenState>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Actividad</h2>
        <ScreenState {...active} onRetry={active.refetch} isEmpty={(data) => data.length === 0} emptyMessage="No tienes partidas activas.">
          {(data) => (
            <div className="flex flex-col gap-3">
              {data.slice(0, 5).map((match) => (
                <MatchCard key={match.id} match={match} playerId={playerId} />
              ))}
            </div>
          )}
        </ScreenState>
      </section>
    </div>
  );
}
