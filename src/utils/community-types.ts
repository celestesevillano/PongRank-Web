import type { CommunityResponse } from '@/types/api';

export type CommunityType = CommunityResponse['communityType'];

export const COMMUNITY_TYPE_LABELS: Record<CommunityType, string> = {
  UNIVERSITY: 'Universidad',
  SCHOOL: 'Colegio',
  PUBLIC_PARK: 'Parque',
  PLAY_GROUP: 'Grupo de juego',
  OTHER: 'Otra',
};

export const CREATABLE_COMMUNITY_TYPES: CommunityType[] = ['UNIVERSITY', 'SCHOOL', 'PLAY_GROUP', 'OTHER'];
