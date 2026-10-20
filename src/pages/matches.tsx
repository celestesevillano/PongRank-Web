import { useSearchParams } from 'react-router-dom';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Tabs } from '@/components/ui/tabs';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { matchesService } from '@/services/matches.service';

type Tab = 'active' | 'history';

export default function MatchesPage() {
  const { player } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'history' ? 'history' : 'active';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Partidas</h1>
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
  const active = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);

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

function MatchHistory({ playerId }: { playerId: number }) {
  const history = usePaginated((params, signal) => matchesService.byPlayer(playerId, { ...params, status: 'CONFIRMED' }, signal), [playerId]);

  return (
    <ScreenState {...history} onRetry={history.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="Aún no tienes partidas jugadas.">
      {(page) => (
        <>
          <div className="flex flex-col gap-3">
            {page.content.map((match) => (
              <MatchCard key={match.id} match={match} playerId={playerId} />
            ))}
          </div>
          <PaginationBar page={page} size={history.size} onPageChange={history.setPage} onSizeChange={history.setSize} />
        </>
      )}
    </ScreenState>
  );
}
