import { http } from '@/services/http';

export type TournamentFormat = 'BO3' | 'BO5' | 'BO7';

export type Tournament = {
  id: number;
  name: string;
  clubId: number;
  clubName?: string;
  matchFormat: TournamentFormat;
  status: 'OPEN' | 'GROUP_STAGE' | 'KNOCKOUT_STAGE' | 'FINISHED';
  startDate?: string | null;
};

export const tournamentsService = {
  list: (clubId: number, signal?: AbortSignal) =>
    http.get(`/tournaments/clubs/${clubId}`, { params: { page: 0, size: 20 }, signal }).then((r) => r.data?.content ?? []),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<Tournament>(`/tournaments/${id}`, { signal }).then((r) => r.data),

  create: (input: { clubId: number; name: string; type: 'INTERNAL' | 'OPEN'; matchFormat: TournamentFormat; startDate?: string }) =>
    http.post<Tournament>('/tournaments', input).then((r) => r.data),

  addParticipant: (tournamentId: number, playerId: number) =>
    http.post(`/tournaments/${tournamentId}/participants`, { playerId }).then((r) => r.data),

  start: (tournamentId: number) =>
    http.post(`/tournaments/${tournamentId}/start`).then((r) => r.data),
};
