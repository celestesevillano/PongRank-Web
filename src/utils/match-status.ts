import type { MatchResponse, MatchStatus } from '@/types/api';

type StatusTone = 'pending' | 'action' | 'success' | 'danger' | 'neutral';

export const STATUS_INFO: Record<MatchStatus, { label: string; tone: StatusTone }> = {
  CREATED: { label: 'Por jugar', tone: 'pending' },
  PROPOSED_P1: { label: 'Por confirmar', tone: 'action' },
  PROPOSED_P2: { label: 'Por confirmar', tone: 'action' },
  CONFIRMED: { label: 'Confirmada', tone: 'success' },
  DISPUTED: { label: 'En disputa', tone: 'danger' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
  WALKOVER: { label: 'Walkover', tone: 'neutral' },
};

export const FORMAT_LABELS = { BO3: 'Al mejor de 3', BO5: 'Al mejor de 5', BO7: 'Al mejor de 7' } as const;

export function matchPerspective(match: MatchResponse, playerId: number) {
  const isPlayer1 = match.player1.id === playerId;
  const isParticipant = isPlayer1 || match.player2?.id === playerId;
  const opponent = isPlayer1 ? match.player2 : match.player1;
  const proposed = match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2';
  const proposedByMe = isParticipant && ((match.status === 'PROPOSED_P1' && isPlayer1) || (match.status === 'PROPOSED_P2' && !isPlayer1));

  return {
    isPlayer1,
    isParticipant,
    opponent,
    ratingDelta: isPlayer1 ? match.ratingDeltaP1 : match.ratingDeltaP2,
    waitingForOpponent: isParticipant && match.status === 'CREATED' && match.player2 === null,
    canScore: isParticipant && match.status === 'CREATED' && match.player2 !== null,
    proposedByMe,
    awaitingMyReview: isParticipant && proposed && !proposedByMe,
    canCancel: isParticipant && match.status !== 'CONFIRMED' && match.status !== 'CANCELLED' && match.status !== 'WALKOVER',
    iWon: match.winnerId === null ? null : match.winnerId === playerId,
  };
}
