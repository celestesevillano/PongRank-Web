import { http } from '@/services/http';
import type { PlayerSummary } from '@/types/api';

export type TournamentFormat = 'BO3' | 'BO5' | 'BO7';

export type Tournament = {
  id: number;
  name: string;
  clubId: number;
  clubName?: string;
  matchFormat: TournamentFormat;
  status: 'OPEN' | 'GROUP_STAGE' | 'KNOCKOUT_STAGE' | 'FINISHED';
  directElimination?: boolean;
  startDate?: string | null;
  winner?: PlayerSummary | null;
};

export type Fixture = {
  id: number;
  stage: 'GROUP' | 'KNOCKOUT';
  round: number;
  bracketPosition: number;
  player1: PlayerSummary | null;
  player2: PlayerSummary | null;
  winner: PlayerSummary | null;
  matchId: number | null;
  status: 'PENDING_PLAYERS' | 'SCHEDULED' | 'COMPLETED' | 'WALKOVER' | 'BYE';
};

export type Participant = { player: PlayerSummary; seed: number };

export const tournamentsService = {
  list: (clubId: number, signal?: AbortSignal) =>
    http.get(`/tournaments/clubs/${clubId}`, { params: { page: 0, size: 20 }, signal }).then((r) => r.data?.content ?? []),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<Tournament>(`/tournaments/${id}`, { signal }).then((r) => r.data),

  create: (input: { clubId: number; name: string; type: 'INTERNAL' | 'OPEN'; matchFormat: TournamentFormat; startDate?: string }) =>
    http.post<Tournament>('/tournaments', input).then((r) => r.data),

  fullDetail: async (id: number, signal?: AbortSignal) => {
    const [tournament, participants, matches] = await Promise.all([
      http.get<Tournament>(`/tournaments/${id}`, { signal }),
      http.get<Participant[]>(`/tournaments/${id}/participants`, { signal }),
      http.get<Fixture[]>(`/tournaments/${id}/matches`, { signal }),
    ]);
    return { tournament: tournament.data, participants: participants.data, matches: matches.data };
  },

  publish: (input: { clubId: number; name: string; matchFormat: TournamentFormat; scheduledAt: string; playerIds: number[]; publicationKey: string }) =>
    http.post<Tournament>('/tournaments/direct-elimination', input).then((r) => r.data),

  addParticipant: (tournamentId: number, playerId: number) =>
    http.post(`/tournaments/${tournamentId}/participants`, { playerId }).then((r) => r.data),

  start: (tournamentId: number) =>
    http.post(`/tournaments/${tournamentId}/start`).then((r) => r.data),
};
