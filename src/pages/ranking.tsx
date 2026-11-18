import { useSearchParams } from 'react-router-dom';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService } from '@/services/communities.service';

export default function RankingPage() {
  const { player } = useSession();
  const [searchParams] = useSearchParams();
  const communities = useFetch((signal) => communitiesService.mine(signal), []);
  const communityId = Number(searchParams.get('community')) || communities.data?.[0]?.id;

  const ranking = usePaginated(
    (params, signal) => communitiesService.ranking(communityId!, params, signal),
    [communityId],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold md:text-4xl">Ranking</h1>
      </div>

      {communities.data && communities.data.length > 1 && (
        <div role="tablist" aria-label="Comunidad" className="flex flex-wrap gap-2">
          {communities.data.map((community) => (
            <button
              key={community.id}
              type="button"
              role="tab"
              aria-selected={community.id === communityId}
              onClick={() => ranking.update({ community: String(community.id), page: '0' })}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold ${community.id === communityId ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:text-white'}`}
            >
              {community.name}
            </button>
          ))}
        </div>
      )}

      <ScreenState
        {...communities}
        onRetry={communities.refetch}
        isEmpty={(data) => data.length === 0}
        emptyMessage="Aún no perteneces a ninguna comunidad. Únte a una desde la app móvil."
      >
        {() => (
          <ScreenState {...ranking} onRetry={ranking.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="Esta comunidad todavía no tiene jugadores en el ranking.">
            {(page) => (
              <>
                <Card className="p-0">
                  <table className="w-full text-left">
                    <thead className="border-b border-line text-xs text-muted uppercase">
                      <tr>
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Jugador</th>
                        <th className="px-5 py-4 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {page.content.map((entry) => (
                        <tr key={entry.playerId} className={entry.playerId === player!.id ? 'bg-brand/15' : ''}>
                          <td className="px-5 py-4 text-lg font-extrabold text-brand">{entry.position}</td>
                          <td className="px-5 py-4 text-lg">{entry.playerName}</td>
                          <td className="px-5 py-4 text-right text-lg font-extrabold tabular-nums">{Math.round(entry.ratingGlicko)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <PaginationBar page={page} size={ranking.size} onPageChange={ranking.setPage} onSizeChange={ranking.setSize} />
              </>
            )}
          </ScreenState>
        )}
      </ScreenState>
    </div>
  );
}
