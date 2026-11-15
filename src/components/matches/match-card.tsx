import { Link } from 'react-router-dom';

import { MatchStatusBadge } from '@/components/matches/match-status-badge';
import { Card } from '@/components/ui/card';
import type { MatchResponse } from '@/types/api';
import { matchPerspective } from '@/utils/match-status';

export function MatchCard({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const { opponent, ratingDelta, awaitingMyReview } = matchPerspective(match, playerId);

  return (
    <Link to={`/matches/${match.id}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-brand">
      <Card className={`transition hover:border-brand ${awaitingMyReview ? 'border-brand/60' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-bold">vs {opponent?.name ?? 'Rival por definir'}</p>
          <MatchStatusBadge status={match.status} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted">
          <span className="truncate">
            {match.format} · {match.communityName ?? match.tournamentName ?? 'Partida libre'}
          </span>
          {match.scoreSummary && <span className="font-bold text-white">{match.scoreSummary}</span>}
        </div>
        {awaitingMyReview && <p className="mt-1 text-sm font-bold text-brand">Te toca confirmar el resultado</p>}
        {ratingDelta !== null && (
          <p className={`mt-1 text-sm font-bold ${ratingDelta >= 0 ? 'text-emerald-400' : 'text-brand'}`}>
            {ratingDelta >= 0 ? '+' : ''}
            {Math.round(ratingDelta)} rating
          </p>
        )}
      </Card>
    </Link>
  );
}
