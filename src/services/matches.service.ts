import { http } from '@/services/http';
import type { LiveMatchAction, LiveMatchState, MatchDetail, MatchFormat, MatchResponse, MatchStatus, Page, PageParams, SetScore } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export type Coordinates = { latitude: number; longitude: number };

export type MatchCreateInput = {
  matchType: 'FRIEND' | 'COMMUNITY' | 'LOCATION';
  format: MatchFormat;
  opponentId?: number;
  communityId?: number;
  scheduledAt?: string;
} & Partial<Coordinates>;

export const ACTIVE_STATUSES = ['CREATED', 'PROPOSED_P1', 'PROPOSED_P2', 'DISPUTED'] as const;

const TOURNAMENT_PAGE_SIZE = 50;
const HISTORY_PAGE_SIZE = 100;

export const MATCH_SORTS = { newest: 'createdAt,desc', oldest: 'createdAt,asc', lastConfirmed: 'confirmedAt,desc' } as const;
export type MatchSort = keyof typeof MATCH_SORTS;

type PlayerMatchesParams = PageParams & { status?: MatchStatus; sort?: MatchSort };

export const matchesService = {
  byPlayer: (playerId: number, { sort, ...params }: PlayerMatchesParams, signal?: AbortSignal): Promise<Page<MatchResponse>> =>
    http
      .get(`/matches/player/${playerId}`, { params: { ...params, sort: sort ? MATCH_SORTS[sort] : undefined }, signal })
      .then((r) => normalizePage<MatchResponse>(r.data)),

  confirmedHistory: async (playerId: number, signal?: AbortSignal) => {
    const matches = new Map<number, MatchResponse>();
    for (let page = 0; ; page++) {
      const result = await matchesService.byPlayer(playerId, { status: 'CONFIRMED', page, size: HISTORY_PAGE_SIZE, sort: 'lastConfirmed' }, signal);
      for (const match of result.content) matches.set(match.id, match);
      if (result.last || result.content.length === 0) return [...matches.values()];
    }
  },

  active: async (playerId: number, signal?: AbortSignal) => {
    const pages = await Promise.all(
      ACTIVE_STATUSES.map((status) => matchesService.byPlayer(playerId, { status, size: 10 }, signal)),
    );
    return pages.flatMap((page) => page.content).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  forTournaments: async (playerId: number, signal?: AbortSignal) => {
    const matches: MatchResponse[] = [];
    for (let page = 0; ; page++) {
      const result = await matchesService.byPlayer(playerId, { page, size: TOURNAMENT_PAGE_SIZE, sort: 'newest' }, signal);
      matches.push(...result.content.filter((match) => match.matchType === 'TOURNAMENT'));
      if (result.last || result.content.length === 0) return matches;
    }
  },

  tournamentMatches: (tournamentId: number, signal?: AbortSignal) =>
    http.get(`/tournaments/${tournamentId}/matches`, { signal }).then(({ data }) => {
      const list = Array.isArray(data) ? data : data?.content ?? [];
      return list as { id: number; round?: number; player1?: { name: string }; player2?: { name: string } | null; scoreSummary?: string }[];
    }),

  open: (location: Coordinates, signal?: AbortSignal) =>
    http.get<MatchResponse[]>('/matches/open', { params: location, signal }).then((r) => r.data),

  get: (matchId: number, signal?: AbortSignal) => http.get<MatchDetail>(`/matches/${matchId}`, { signal }).then((r) => r.data),

  live: (matchId: number, signal?: AbortSignal) => http.get<LiveMatchState>(`/matches/${matchId}/live`, { signal }).then((r) => r.data),

  updateLive: (matchId: number, action: LiveMatchAction, revision?: number) =>
    http.post<LiveMatchState>(`/matches/${matchId}/live`, { action, revision }).then((r) => r.data),

  submitScore: (matchId: number, sets: SetScore[]) =>
    http.post<MatchDetail>(`/matches/${matchId}/submit`, { sets }).then((r) => r.data),

  confirm: (matchId: number) => http.put<MatchDetail>(`/matches/${matchId}/confirm`).then((r) => r.data),

  dispute: (matchId: number, reason: string) =>
    http.put<MatchDetail>(`/matches/${matchId}/dispute`, { reason }).then((r) => r.data),

  cancel: (matchId: number) => http.put<MatchResponse>(`/matches/${matchId}/cancel`).then((r) => r.data),

  create: (input: MatchCreateInput) => http.post<MatchResponse>('/matches', input).then((r) => r.data),

  join: (matchId: number, location: Coordinates) =>
    http.post<MatchResponse>(`/matches/${matchId}/join`, location).then((r) => r.data),
};
