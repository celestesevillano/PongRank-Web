import { Bot, ChartNoAxesCombined, Shield, Users, type LucideIcon } from 'lucide-react';

import type { MembershipPlan, MyPlanResponse, PaidPlan } from '@/types/api';

export const PLAN_LABEL: Record<MembershipPlan, string> = { FREEMIUM: 'Free', BASIC: 'Básico', PRO: 'Pro', ENTERPRISE: 'Enterprise' };

export const PAID_PLANS: { plan: PaidPlan; price: string; description: string; recommended?: boolean }[] = [
  { plan: 'BASIC', price: 'S/ 9.90', description: '4 espacios y estadísticas' },
  { plan: 'PRO', price: 'S/ 19.90', description: '6 espacios, estadísticas y Coach', recommended: true },
  { plan: 'ENTERPRISE', price: 'S/ 39.90', description: 'Tu club, 6 espacios y Coach' },
];

export const PLAN_ART: Record<PaidPlan, { image: string; accent: string; background: string }> = {
  BASIC: { image: '/illustrations/home/pongrank-plan-basic.webp', accent: '#22D3EE', background: '#0B2229' },
  PRO: { image: '/illustrations/home/pongrank-plan-pro.webp', accent: '#FF8796', background: '#28141B' },
  ENTERPRISE: { image: '/illustrations/home/pongrank-plan-enterprise.webp', accent: '#FFD278', background: '#2A2016' },
};

export const HomeArt = {
  statistics: '/illustrations/home/pongrank-home-statistics.webp',
  coach: '/illustrations/home/pongrank-home-coach.webp',
} as const;

type Benefit = { Icon: LucideIcon; title: string; description: string };

const statistics: Benefit = { Icon: ChartNoAxesCombined, title: 'Estadísticas', description: 'Tu rating, porcentaje de victorias, racha y mejor victoria.' };
const coach: Benefit = { Icon: Bot, title: 'Coach Pongi', description: 'Analiza tu postura y movimiento con la cámara (app móvil).' };
const club = (maximum: number): Benefit => ({
  Icon: Shield,
  title: maximum === 1 ? '1 club propio' : `${maximum} clubes propios`,
  description: 'Lo creas y administras tú. Ocupa 1 de tus espacios.',
});

export function planBenefits(plan: MembershipPlan, quotas?: MyPlanResponse): Benefit[] {
  const total = quotas?.maxSpaces ?? (plan === 'FREEMIUM' ? 2 : plan === 'BASIC' ? 4 : 6);
  const spaces: Benefit = {
    Icon: Users,
    title: `${total} espacios`,
    description:
      plan === 'ENTERPRISE'
        ? 'Tu club y las comunidades que crees o a las que te unas.'
        : plan === 'FREEMIUM'
          ? 'Únete a comunidades. Cada una usa 1 espacio.'
          : 'Comunidades y clubes. Cada uno usa 1 espacio.',
  };
  switch (plan) {
    case 'FREEMIUM':
      return [spaces];
    case 'BASIC':
      return [spaces, statistics];
    case 'PRO':
      return [spaces, statistics, coach];
    case 'ENTERPRISE':
      return [club(quotas?.maxClubsTotal ?? 1), spaces, statistics, coach];
  }
}
