import { Link, useSearchParams } from 'react-router-dom';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { SelectField } from '@/components/ui/select-field';
import { Tabs } from '@/components/ui/tabs';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { matchesService, type MatchSort } from '@/services/matches.service';
import type { MatchStatus } from '@/types/api';
import { matchPerspective } from '@/utils/match-status';

type Tab = 'active' | 'history';

export default function MatchesPage() {
  const { player } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'history' ? 'history' : 'active';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Partidas</h1>
        <div className="flex gap-2">
          <Link to="/matches/find" className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-line">
            Buscar partida
          </Link>
          <Link to="/matches/new" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold hover:bg-brand-dark">
            Crear partida
          </Link>
        </div>
      </div>
      <Tabs<Tab>
        tabs={[
          { value: 'active', label: 'Activas' },
          { value: 'history', label: 'Historial' },
        ]}
        active={tab}
        onChange={(value) => setSearchParams(value === 'history' ? { tab: value } : {})}
      />
      {tab === 'active' ? <ActiveMatches playerId={player!.id} /> : <MatchHistory playerId={player!.id} />}
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
    <ScreenState {...active} onRetry={active.refetch} isEmpty={(data) => data.length === 0} emptyMessage="No tienes partidas activas.">
      {(data) => (
        <div className="flex flex-col gap-3">
          {data.map((match) => (
            <MatchCard key={match.id} match={match} playerId={playerId} />
          ))}
        </div>
      )}
    </ScreenState>
  );
}

const HISTORY_FILTERS = [
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'DISPUTED', label: 'En disputa' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'WALKOVER', label: 'Walkover' },
] as const satisfies { value: MatchStatus; label: string }[];

type HistoryFilter = (typeof HISTORY_FILTERS)[number]['value'];

const SORT_OPTIONS: { value: MatchSort; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
];

const EMPTY_MESSAGES: Record<HistoryFilter, string> = {
  CONFIRMED: 'Aún no tienes partidas confirmadas. Las que esperan confirmación están en Activas.',
  DISPUTED: 'No tienes partidas en disputa.',
  CANCELLED: 'No tienes partidas canceladas.',
  WALKOVER: 'No tienes partidas cerradas por W.O.',
};

const pick = <T extends string>(value: string | null, allowed: readonly { value: T }[], fallback: T): T =>
  allowed.some((option) => option.value === value) ? (value as T) : fallback;

function MatchHistory({ playerId }: { playerId: number }) {
  const [searchParams] = useSearchParams();
  const filter = pick(searchParams.get('status'), HISTORY_FILTERS, 'CONFIRMED');
  const sort = pick(searchParams.get('sort'), SORT_OPTIONS, 'newest');
  const history = usePaginated(
    (params, signal) => matchesService.byPlayer(playerId, { ...params, status: filter, sort }, signal),
    [playerId, filter, sort],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <SelectField label="Estado" value={filter} options={[...HISTORY_FILTERS]} onChange={(value) => history.update({ status: value, page: '0' })} />
        <SelectField label="Orden" value={sort} options={SORT_OPTIONS} onChange={(value) => history.update({ sort: value, page: '0' })} />
      </div>
      <ScreenState
        {...history}
        onRetry={history.refetch}
        isEmpty={(data) => data.content.length === 0}
        emptyMessage={EMPTY_MESSAGES[filter]}
      >
        {(page) => (
          <>
            <div className={`flex flex-col gap-3 transition-opacity ${history.loading ? 'opacity-60' : ''}`}>
              {page.content.map((match) => (
                <MatchCard key={match.id} match={match} playerId={playerId} />
              ))}
            </div>
            <PaginationBar page={page} size={history.size} onPageChange={history.setPage} onSizeChange={history.setSize} />
          </>
        )}
      </ScreenState>
    </div>
  );
}
