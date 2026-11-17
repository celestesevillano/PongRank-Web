import { Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PaginationBar } from '@/components/common/pagination-bar';
import { Spinner } from '@/components/common/spinner';
import { MatchBanner } from '@/components/matches/match-banner';
import { MatchCard } from '@/components/matches/match-card';
import { MatchState } from '@/components/matches/match-state';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { ChipGroup } from '@/components/ui/chip-group';
import { SelectField } from '@/components/ui/select-field';
import { Tabs } from '@/components/ui/tabs';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { MatchArt } from '@/lib/match-art';
import { paths } from '@/routes/paths';
import { matchesService, type MatchSort } from '@/services/matches.service';
import type { MatchStatus } from '@/types/api';
import { isRetryable, type ApiError } from '@/utils/api-error';
import { matchPerspective } from '@/utils/match-status';

type Tab = 'active' | 'history' | 'tournaments';

const TABS: { value: Tab; label: string }[] = [
  { value: 'active', label: 'Activas' },
  { value: 'history', label: 'Historial' },
  { value: 'tournaments', label: 'Torneos' },
];

const HISTORY_FILTERS = [
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'WALKOVER', label: 'Walkover' },
] as const satisfies { value: MatchStatus; label: string }[];

type HistoryFilter = (typeof HISTORY_FILTERS)[number]['value'];

const SORT_OPTIONS: { value: MatchSort; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
];

const HISTORY_EMPTY: Record<HistoryFilter, string> = {
  CONFIRMED: 'Aún no tienes partidas jugadas. Las que esperan confirmación están en Activas.',
  CANCELLED: 'No tienes partidas canceladas.',
  WALKOVER: 'No tienes partidas cerradas por incomparecencia.',
};

const pick = <T extends string>(value: string | null, allowed: readonly { value: T }[], fallback: T): T =>
  allowed.some((option) => option.value === value) ? (value as T) : fallback;

export default function MatchesPage() {
  const { player } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = pick(searchParams.get('tab'), TABS, 'active');
  const playerId = player!.id;

  return (
    <div className="flex flex-col gap-4">
      <MatchBanner title="Partidas" prominent>
        <p className="text-[13px] text-[#EBC4CB]">Tu actividad en la mesa</p>
      </MatchBanner>
      <Tabs<Tab> tabs={TABS} active={tab} onChange={(value) => setSearchParams(value === 'active' ? {} : { tab: value })} />
      {tab === 'active' && <ActiveMatches playerId={playerId} />}
      {tab === 'history' && <MatchHistory playerId={playerId} />}
      {tab === 'tournaments' && <TournamentMatches playerId={playerId} />}
    </div>
  );
}

function ActiveMatches({ playerId }: { playerId: number }) {
  const active = useFetch(async (signal) => {
    const matches = await matchesService.active(playerId, signal);
    const needsMe = (match: (typeof matches)[number]) => (matchPerspective(match, playerId).awaitingMyReview ? 0 : 1);
    return [...matches].sort((a, b) => needsMe(a) - needsMe(b));
  }, [playerId]);

  return (
    <>
      <LoadState loading={active.loading && !active.data} error={active.error} onRetry={active.refetch}>
        {active.data?.length ? (
          <MatchGrid>
            {active.data.map((match) => (
              <MatchCard key={match.id} match={match} playerId={playerId} />
            ))}
          </MatchGrid>
        ) : (
          <MatchState title="Sin partidas activas" message="Crea una partida o busca una abierta." art={MatchArt.idle} />
        )}
      </LoadState>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={paths.newMatch} icon={Plus} className="flex-1">
          Nueva partida
        </ButtonLink>
        <ButtonLink to={paths.findMatch} variant="secondary" icon={Search} className="flex-1">
          Buscar partida
        </ButtonLink>
      </div>
    </>
  );
}

function MatchHistory({ playerId }: { playerId: number }) {
  const [searchParams] = useSearchParams();
  const filter = pick(searchParams.get('status'), HISTORY_FILTERS, 'CONFIRMED');
  const sort = pick(searchParams.get('sort'), SORT_OPTIONS, 'newest');
  const history = usePaginated((params, signal) => matchesService.byPlayer(playerId, { ...params, status: filter, sort }, signal), [playerId, filter, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipGroup label="Filtrar por estado" value={filter} options={[...HISTORY_FILTERS]} onChange={(value) => history.update({ status: value, page: '0' })} />
        <SelectField label="Orden" value={sort} options={SORT_OPTIONS} onChange={(value) => history.update({ sort: value, page: '0' })} />
      </div>
      <LoadState loading={history.loading && !history.data} error={history.error} onRetry={history.refetch}>
        {history.data && history.data.content.length > 0 ? (
          <>
            <MatchGrid dimmed={history.loading}>
              {history.data.content.map((match) => (
                <MatchCard key={match.id} match={match} playerId={playerId} />
              ))}
            </MatchGrid>
            <PaginationBar page={history.data} size={history.size} onPageChange={history.setPage} onSizeChange={history.setSize} />
          </>
        ) : (
          <MatchState title="Sin partidas" message={HISTORY_EMPTY[filter]} art={MatchArt.idle} />
        )}
      </LoadState>
    </div>
  );
}

function TournamentMatches({ playerId }: { playerId: number }) {
  const tournaments = useFetch((signal) => matchesService.forTournaments(playerId, signal), [playerId]);

  return (
    <LoadState loading={tournaments.loading && !tournaments.data} error={tournaments.error} onRetry={tournaments.refetch}>
      {tournaments.data?.length ? (
        <MatchGrid>
          {tournaments.data.map((match) => (
            <MatchCard key={match.id} match={match} playerId={playerId} />
          ))}
        </MatchGrid>
      ) : (
        <MatchState title="Sin partidas de torneo" message="Consulta los torneos desde tu club." art={MatchArt.tournaments} />
      )}
    </LoadState>
  );
}

function MatchGrid({ children, dimmed = false }: { children: ReactNode; dimmed?: boolean }) {
  return <div className={`grid gap-2 transition-opacity sm:grid-cols-2 ${dimmed ? 'opacity-60' : ''}`}>{children}</div>;
}

function LoadState({ loading, error, onRetry, children }: { loading: boolean; error: ApiError | null; onRetry: () => void; children: ReactNode }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <MatchState title={error.isNetwork ? 'Problema de conexión' : 'No pudimos cargar las partidas'} message={error.message} art={error.isNetwork ? MatchArt.offline : undefined}>
        {isRetryable(error) && (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </MatchState>
    );
  }
  return <>{children}</>;
}
