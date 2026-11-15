import type { MatchStatus } from '@/types/api';
import { STATUS_INFO } from '@/utils/match-status';

const TONE_STYLES = {
  pending: 'border-amber-400/40 text-amber-300',
  action: 'border-brand/60 text-brand',
  success: 'border-emerald-400/40 text-emerald-300',
  danger: 'border-red-400/60 text-red-300',
  neutral: 'border-line text-muted',
} as const;

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const { label, tone } = STATUS_INFO[status];
  return <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE_STYLES[tone]}`}>{label}</span>;
}
