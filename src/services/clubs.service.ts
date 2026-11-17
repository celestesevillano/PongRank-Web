import { http } from '@/services/http';
import type { Club, ClubMembership, PageParams } from '@/types/api';
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
  search: (params: PageParams & { name?: string }, signal?: AbortSignal) =>
    http.get('/clubs', { params, signal }).then(({ data }) => normalizePage<Club>(data)),

  managed: (signal?: AbortSignal) => http.get<Club[]>('/clubs/me', { signal }).then((r) => r.data),

  detail: (id: number, signal?: AbortSignal) =>
    http.get<Club>(`/clubs/${id}`, { signal }).then((r) => r.data),

  announcements: (clubId: number, signal?: AbortSignal) =>
    http.get(`/clubs/${clubId}/announcements`, { signal }).then(({ data }) => data as { id: number; title: string; body: string; authorName: string; createdAt: string }[]),

  createAnnouncement: (clubId: number, input: { title: string; body: string }) =>
    http.post(`/clubs/${clubId}/announcements`, input).then((r) => r.data),

  update: (id: number, input: { name?: string; address?: string; description?: string }) =>
    http.patch<Club>(`/clubs/${id}`, input).then((r) => r.data),

  pending: (clubId: number, signal?: AbortSignal) =>
    allPages<ClubMembership>(`/club-memberships/clubs/${clubId}/pending`, signal),

  reviewMembership: (id: number, decision: 'approve' | 'reject') =>
    http.patch(`/club-memberships/${id}/${decision}`).then((r) => r.data),

  memberships: (playerId: number, signal?: AbortSignal) => allPages<ClubMembership>(`/club-memberships/players/${playerId}`, signal),

  members: (clubId: number, signal?: AbortSignal) => allPages<ClubMembership>(`/club-memberships/clubs/${clubId}/members`, signal),

  requestMembership: (clubId: number) => http.post('/club-memberships', { clubId }).then((r) => r.data),

  register: (input: { name: string; address: string; description?: string; affiliationDocumentUrl: string }) =>
    http.post('/clubs', input).then((r) => r.data),

  leave: (id: number) => http.patch(`/club-memberships/${id}/leave`).then((r) => r.data),
};
