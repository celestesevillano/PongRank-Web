import type { MatchStatus } from '@/types/api';
import { STATUS_INFO } from '@/utils/match-status';

const TONE_STYLES = {
  pending: 'border-accent/50 text-accent',
  action: 'border-brand bg-brand/10 text-brand',
  success: 'border-success/50 text-success',
  danger: 'border-gold/60 text-gold',
  neutral: 'border-line text-faint',
} as const;

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const { label, tone } = STATUS_INFO[status];
  return <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE_STYLES[tone]}`}>{label}</span>;
}
