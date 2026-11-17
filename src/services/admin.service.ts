import { http } from '@/services/http';
import type { AdminFederatedReview, ClubReview, ClubReviewHistory, FederatedRankingEntry, FederatedStatus, PageParams } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

export const adminService = {
  pendingClubs: (params: PageParams, signal?: AbortSignal) =>
    http.get('/admin/clubs/pending', { params, signal }).then((r) => normalizePage<ClubReview>(r.data)),
  approveClub: (clubId: number) => http.patch<ClubReview>(`/admin/clubs/${clubId}/approve`).then((r) => r.data),
  rejectClub: (clubId: number, rejectionReason: string) =>
    http.patch<ClubReview>(`/admin/clubs/${clubId}/reject`, { rejectionReason }).then((r) => r.data),
  clubReviews: (clubId: number, params: PageParams, signal?: AbortSignal) =>
    http.get(`/admin/clubs/${clubId}/reviews`, { params, signal }).then((r) => normalizePage<ClubReviewHistory>(r.data)),

  federatedReviews: (params: PageParams & { status?: FederatedStatus }, signal?: AbortSignal) =>
    http.get('/admin/fdptm/reviews', { params, signal }).then((r) => normalizePage<AdminFederatedReview>(r.data)),
  federatedRanking: (params: PageParams & { category: string; name?: string }, signal?: AbortSignal) =>
    http.get('/admin/fdptm/ranking', { params, signal }).then((r) => normalizePage<FederatedRankingEntry>(r.data)),
  verifyFederated: (playerId: number, rankingEntryId: number) =>
    http.patch<AdminFederatedReview>(`/admin/fdptm/reviews/${playerId}/verify`, { rankingEntryId }).then((r) => r.data),
  rejectFederated: (playerId: number, reason: string) =>
    http.patch<AdminFederatedReview>(`/admin/fdptm/reviews/${playerId}/reject`, { reason }).then((r) => r.data),
};
