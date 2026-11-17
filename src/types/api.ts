export type PlayerResponse = {
  id: number;
  name: string;
  email: string;
  whatsapp: string | null;
  shareContact: boolean;
  categoryFdptm: string | null;
  federatedDeclared: boolean;
  ratingGlicko: number;
  ratingDeviation: number;
  volatility: number;
  role: string;
  status: string;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  player: PlayerResponse;
};

export type CommunityResponse = {
  id: number;
  name: string;
  description: string | null;
  communityType: 'UNIVERSITY' | 'SCHOOL' | 'PUBLIC_PARK' | 'PLAY_GROUP' | 'OTHER';
  memberCount: number;
};

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type Gender = 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY';

export type PageParams = { page?: number; size?: number };

export type PlayerSummary = {
  id: number;
  name: string;
  username: string | null;
  ratingGlicko: number;
  categoryFdptm: string | null;
  federatedDeclared: boolean | null;
  whatsapp: string | null;
};

export type MatchStatus = 'CREATED' | 'PROPOSED_P1' | 'PROPOSED_P2' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED' | 'WALKOVER';

export type MatchFormat = 'BO3' | 'BO5' | 'BO7';

export type MatchType = 'FRIEND' | 'COMMUNITY' | 'LOCATION' | 'TOURNAMENT';

export type MatchResponse = {
  id: number;
  player1: PlayerSummary;
  player2: PlayerSummary | null;
  communityId: number | null;
  communityName: string | null;
  tournamentId: number | null;
  tournamentName: string | null;
  format: MatchFormat;
  matchType: MatchType;
  status: MatchStatus;
  latitude: number | null;
  longitude: number | null;
  scoreSummary: string | null;
  winnerId: number | null;
  ratingDeltaP1: number | null;
  ratingDeltaP2: number | null;
  createdAt: string;
  confirmedAt: string | null;
  scheduledAt: string | null;
};

export type RankingEntry = {
  position: number;
  playerId: number;
  playerName: string;
  ratingGlicko: number;
  ratingDeviation: number;
};

export type TrainingSessionResponse = {
  id: number;
  player: PlayerSummary;
  swingVelocityMax: number;
  postureScore: number;
  kneeFlexionAngle: number | null;
  shoulderRotationAngle: number | null;
  durationSeconds: number;
  createdAt: string;
  newPersonalBest: boolean;
};

export type MatchSet = {
  id: number;
  setNumber: number;
  scorePlayer1: number;
  scorePlayer2: number;
  winnerPlayerNumber: 1 | 2;
};

export type MatchDetail = MatchResponse & {
  disputeReason: string | null;
  sets: MatchSet[];
};

export type SetScore = { setNumber: number; scorePlayer1: number; scorePlayer2: number };

export type Friendship = {
  id: number;
  playerA: PlayerSummary;
  playerB: PlayerSummary;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string | null;
};

export type CommunityMember = {
  membershipId: number;
  playerId: number;
  playerName: string;
  ratingGlicko: number;
  role: 'COMMUNITY_ADMIN' | 'MEMBER';
  status: string;
  joinedAt: string;
};

export type LiveMatchState = {
  revision: number;
  status: MatchStatus;
  player1Ready: boolean;
  player2Ready: boolean;
  completedSets: SetScore[];
  scorePlayer1: number;
  scorePlayer2: number;
  lastPointBy: 1 | 2 | null;
  finished: boolean;
};

export type LiveMatchAction = 'READY' | 'POINT' | 'UNDO';

export type Club = {
  id: number;
  name: string;
  address: string;
  description?: string | null;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DELETED';
  memberCount?: number | null;
  admin?: PlayerSummary;
};

export type ClubMembership = {
  id: number;
  clubId: number;
  clubName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'LEFT';
  role: 'CLUB_ADMIN' | 'MEMBER';
  player: PlayerSummary | null;
};

export type MembershipPlan = 'FREEMIUM' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export type PaidPlan = Exclude<MembershipPlan, 'FREEMIUM'>;

export type MyPlanResponse = {
  plan: MembershipPlan;
  endDate: string | null;
  coachAccess: boolean;
  canCreateClub: boolean;
  maxCommunitiesCreated: number;
  maxCommunitiesTotal: number;
  maxClubsTotal: number;
  maxSpaces?: number;
  usedSpaces?: number;
};

export type PaymentPreference = { initPoint: string; preferenceId: string };
