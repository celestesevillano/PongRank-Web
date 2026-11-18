import { Trophy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService } from '@/services/communities.service';

const MEDALS = ['#FFD278', '#C9CED6', '#D9955B'];
const podium = <T extends { position: number }>(entries: T[]) => entries.filter(({ position }) => position >= 1 && position <= 3);

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

      {communities.data && communities.data.length > 0 && (
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
        emptyMessage="Únete a una comunidad para ver su ranking."
      >
        {() => (
          <ScreenState {...ranking} onRetry={ranking.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="Esta comunidad todavía no tiene jugadores en el ranking.">
            {(page) => (
              <>
                {podium(page.content).length > 0 && (
                  <Card className="overflow-hidden border-2 border-gold/60 p-0 shadow-[0_0_14px_rgba(255,210,120,0.22)]">
                    <div className="flex items-center gap-2 bg-gold/10 px-5 py-3">
                      <Trophy className="size-5 text-gold" aria-hidden />
                      <h2 className="text-lg font-extrabold">Top 3 de la comunidad</h2>
                    </div>
                    {podium(page.content).map((entry) => (
                      <div key={entry.playerId} className="flex items-center gap-4 border-t border-line px-5 py-3" style={{ backgroundColor: MEDALS[entry.position - 1] + '26' }}>
                        <span className="w-8 text-xl font-black" style={{ color: MEDALS[entry.position - 1] }}>{entry.position}</span>
                        <span className="flex-1 text-lg font-semibold">{entry.playerName}{entry.playerId === player!.id ? ' (tú)' : ''}</span>
                        <span className="text-xl font-extrabold tabular-nums" style={{ color: MEDALS[entry.position - 1] }}>{Math.round(entry.ratingGlicko)}</span>
                      </div>
                    ))}
                  </Card>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Posiciones</h2>
                  <span className="text-xs text-muted">Rating PongRank</span>
                </div>
                <div className="flex flex-col gap-2">
                  {page.content.filter((entry) => entry.position > 3).map((entry) => (
                    <div key={entry.playerId} className={`flex items-center gap-4 rounded-2xl border bg-surface px-5 py-4 ${entry.playerId === player!.id ? 'border-brand' : 'border-transparent'}`}>
                      <span className="w-8 text-lg font-extrabold text-muted">{entry.position}</span>
                      <span className="flex-1 text-lg font-semibold">{entry.playerName}</span>
                      <span className="text-lg font-extrabold text-accent tabular-nums">{Math.round(entry.ratingGlicko)}</span>
                    </div>
                  ))}
                </div>
                <PaginationBar page={page} size={ranking.size} onPageChange={ranking.setPage} onSizeChange={ranking.setSize} />
              </>
            )}
          </ScreenState>
        )}
      </ScreenState>
    </div>
  );
}
