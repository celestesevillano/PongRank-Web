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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Ranking</h1>
        {communities.data && communities.data.length > 1 && (
          <select
            value={communityId}
            onChange={(e) => ranking.update({ community: e.target.value, page: '0' })}
            className="rounded-lg border border-line bg-black px-3 py-2"
          >
            {communities.data.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <ScreenState
        {...communities}
        onRetry={communities.refetch}
        isEmpty={(data) => data.length === 0}
        emptyMessage="Aún no perteneces a ninguna comunidad. Únete a una desde la app móvil."
      >
        {() => (
          <ScreenState {...ranking} onRetry={ranking.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="Esta comunidad todavía no tiene jugadores en el ranking.">
            {(page) => (
              <>
                <Card className="p-0">
                  <table className="w-full text-left">
                    <thead className="border-b border-line text-xs text-muted uppercase">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Jugador</th>
                        <th className="px-4 py-3 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {page.content.map((entry) => (
                        <tr key={entry.playerId} className={entry.playerId === player!.id ? 'bg-brand/15' : ''}>
                          <td className="px-4 py-3 font-bold text-brand">{entry.position}</td>
                          <td className="px-4 py-3">{entry.playerName}</td>
                          <td className="px-4 py-3 text-right font-bold">{Math.round(entry.ratingGlicko)}</td>
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
