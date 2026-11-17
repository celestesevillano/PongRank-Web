import type { LucideIcon } from 'lucide-react';

export function MatchMeta({ icon: Icon, text, tone = 'accent' }: { icon: LucideIcon; text: string; tone?: 'accent' | 'brand' }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-muted">
      <Icon aria-hidden className={`size-4 shrink-0 ${tone === 'brand' ? 'text-brand' : 'text-accent'}`} />
      <span className="min-w-0 truncate">{text}</span>
    </p>
  );
}
