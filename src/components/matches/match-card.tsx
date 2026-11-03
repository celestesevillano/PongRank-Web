import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import type { MatchResponse } from '@/types/api';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Esperando rival',
  PROPOSED_P1: 'Por confirmar',
  PROPOSED_P2: 'Por confirmar',
  CONFIRMED: 'Confirmada',
  DISPUTED: 'En disputa',
  CANCELLED: 'Cancelada',
  WALKOVER: 'Walkover',
};

export function MatchCard({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const opponent = match.player1.id === playerId ? match.player2 : match.player1;
  const delta = match.player1.id === playerId ? match.ratingDeltaP1 : match.ratingDeltaP2;

  return (
    <Link to={`/matches/${match.id}`} className="block">
      <Card className="transition hover:border-brand">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">vs {opponent?.name ?? 'Rival por definir'}</p>
          <span className="text-xs font-bold text-brand">{STATUS_LABELS[match.status] ?? match.status}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            {match.format} · {match.communityName ?? match.tournamentName ?? 'Partida libre'}
          </span>
          {match.scoreSummary && <span className="font-bold text-white">{match.scoreSummary}</span>}
        </div>
        {delta !== null && delta !== undefined && (
          <p className={`mt-1 text-sm font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-brand'}`}>
            {delta >= 0 ? '+' : ''}
            {Math.round(delta)} rating
          </p>
        )}
      </Card>
    </Link>
  );
}
