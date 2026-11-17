import { http } from '@/services/http';
import type { Club, ClubMembership } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

const PAGE_SIZE = 100;

async function allPages<T>(url: string, signal?: AbortSignal) {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const { data } = await http.get(url, { params: { page, size: PAGE_SIZE }, signal });
    const result = normalizePage<T>(data);
    items.push(...result.content);
    if (result.last || result.content.length === 0) return items;
  }
}

export const clubsService = {
  managed: (signal?: AbortSignal) => http.get<Club[]>('/clubs/me', { signal }).then((r) => r.data),

  memberships: (playerId: number, signal?: AbortSignal) => allPages<ClubMembership>(`/club-memberships/players/${playerId}`, signal),

  members: (clubId: number, signal?: AbortSignal) => allPages<ClubMembership>(`/club-memberships/clubs/${clubId}/members`, signal),
};
