import { http } from '@/services/http';
import type { Friendship } from '@/types/api';

export const friendshipsService = {
  accepted: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}`, { signal }).then((r) => r.data),

  received: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}/pending`, { signal }).then((r) => r.data),

  sent: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}/sent`, { signal }).then((r) => r.data),

  send: (receiverId: number) => http.post<Friendship>('/friendships/requests', { receiverId }).then((r) => r.data),

  accept: (id: number) => http.patch<Friendship>(`/friendships/${id}/accept`).then((r) => r.data),

  reject: (id: number) => http.patch<Friendship>(`/friendships/${id}/reject`).then((r) => r.data),

  cancel: (id: number) => http.delete(`/friendships/${id}/cancel`).then((r) => r.data),

  remove: (id: number) => http.delete(`/friendships/${id}`).then((r) => r.data),
};

export const friendOf = (friendship: Friendship, myId: number) =>
  friendship.playerA.id === myId ? friendship.playerB : friendship.playerA;
