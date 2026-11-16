import { http } from '@/services/http';
import type { Friendship } from '@/types/api';

export const friendshipsService = {
  accepted: (playerId: number, signal?: AbortSignal) =>
    http.get<Friendship[]>(`/friendships/players/${playerId}`, { signal }).then((r) => r.data),
};

export const friendOf = (friendship: Friendship, myId: number) =>
  friendship.playerA.id === myId ? friendship.playerB : friendship.playerA;
