import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import type { PlayerSummary } from '@/types/api';

export const CIRCLE_OPTIONS = [
  { value: 'friends', label: 'Pongmigos' },
  { value: 'community', label: 'Comunidad' },
  { value: 'club', label: 'Club' },
] as const;

export type Circle = (typeof CIRCLE_OPTIONS)[number]['value'];

export type MatchRival = {
  id: number;
  name: string;
  ratingGlicko: number | null;
  username: string | null;
  groupId?: number;
  groupName?: string;
};

const fromPlayer = (player: PlayerSummary, group?: { id: number; name: string }): MatchRival => ({
  id: player.id,
  name: player.name,
  ratingGlicko: player.ratingGlicko,
  username: player.username,
  groupId: group?.id,
  groupName: group?.name,
});

const MEMBERS_PAGE_SIZE = 100;

export async function matchRivals(circle: Circle, playerId: number, signal: AbortSignal): Promise<MatchRival[]> {
  if (!playerId) return [];
  if (circle === 'friends') {
    const friendships = await friendshipsService.accepted(playerId, signal);
    return friendships.map((friendship) => fromPlayer(friendOf(friendship, playerId)));
  }

  const rivals = new Map<number, MatchRival>();
  if (circle === 'club') {
    const [memberships, managed] = await Promise.all([clubsService.memberships(playerId, signal), clubsService.managed(signal)]);
    const clubs = new Map(managed.map((club) => [club.id, club.name]));
    for (const membership of memberships) if (membership.status === 'APPROVED') clubs.set(membership.clubId, membership.clubName);
    for (const [id, name] of clubs) {
      for (const { player } of await clubsService.members(id, signal)) {
        if (player && player.id !== playerId) rivals.set(player.id, fromPlayer(player, { id, name }));
      }
    }
    return [...rivals.values()];
  }

  for (const community of await communitiesService.mine(signal)) {
    for (let page = 0; ; page++) {
      const result = await communitiesService.members(community.id, { page, size: MEMBERS_PAGE_SIZE }, signal);
      for (const member of result.content) {
        if (member.playerId !== playerId && member.status === 'ACTIVE') {
          rivals.set(member.playerId, { id: member.playerId, name: member.playerName, ratingGlicko: member.ratingGlicko, username: null, groupId: community.id, groupName: community.name });
        }
      }
      if (result.last || result.content.length === 0) break;
    }
  }
  return [...rivals.values()];
}
