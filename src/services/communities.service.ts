import { http } from '@/services/http';
import type { CommunityMember, CommunityResponse, Page, PageParams, RankingEntry } from '@/types/api';
import type { CommunityType } from '@/utils/community-types';
import { normalizePage } from '@/utils/pagination';

export type CommunityCreateInput = { name: string; description?: string; communityType: CommunityType; customLabel?: string };

export const communitiesService = {
  create: (input: CommunityCreateInput) => http.post<CommunityResponse>('/communities', input).then((r) => r.data),

  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/communities', { params, signal }).then((r) => normalizePage<CommunityResponse>(r.data)),

  mine: (signal?: AbortSignal) => http.get<CommunityResponse[]>('/communities/me', { signal }).then((r) => r.data),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<CommunityResponse>(`/communities/${id}`, { signal }).then((r) => r.data),

  update: (id: number, input: Partial<CommunityCreateInput>) =>
    http.patch<CommunityResponse>(`/communities/${id}`, input).then((r) => r.data),

  ranking: (communityId: number, params: PageParams, signal?: AbortSignal): Promise<Page<RankingEntry>> =>
    http.get(`/communities/${communityId}/ranking`, { params, signal }).then((r) => normalizePage<RankingEntry>(r.data)),

  members: (communityId: number, params: PageParams, signal?: AbortSignal): Promise<Page<CommunityMember>> =>
    http.get(`/communities/${communityId}/members`, { params, signal }).then((r) => normalizePage<CommunityMember>(r.data)),

  leave: (communityId: number, playerId: number) =>
    http.delete<void>(`/communities/${communityId}/members/${playerId}`).then((r) => r.data),

  join: (communityId: number) => http.post<unknown>(`/communities/${communityId}/members`, {}).then((r) => r.data),
};
