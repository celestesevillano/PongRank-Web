import type { MatchResponse } from '@/types/api';

export const FORMAT_LABELS = { BO3: 'Mejor de 3', BO5: 'Mejor de 5', BO7: 'Mejor de 7' } as const;

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

export function matchPlace(match: MatchResponse) {
  return match.communityName ?? (match.latitude !== null && match.longitude !== null ? 'Lugar de encuentro' : null);
}

const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

export const parseServerDate = (value: string | Date) => (value instanceof Date ? value : new Date(HAS_TIMEZONE.test(value) ? value : `${value}Z`));

export const matchTime = (when: string | Date) => parseServerDate(when).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const SOURCE_LABELS = { FRIEND: 'Pongmigos', COMMUNITY: 'Comunidad', LOCATION: 'Partida libre', TOURNAMENT: 'Torneo' } as const;

export const matchSource = (match: MatchResponse) => SOURCE_LABELS[match.matchType];
