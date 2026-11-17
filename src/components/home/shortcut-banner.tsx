import { ChevronRight, LockKeyhole, type LucideIcon } from 'lucide-react';

import { CardLighting } from '@/components/common/card-lighting';

const CYAN = '#22D3EE';
const RED = '#E8262F';

type ShortcutBannerProps = {
  title: string;
  subtitle: string;
  locked: boolean;
  Icon: LucideIcon;
  artwork: string;
  coach?: boolean;
  onClick: () => void;
};

export function ShortcutBanner({ title, subtitle, locked, Icon, artwork, coach = false, onClick }: ShortcutBannerProps) {
  const accentText = coach ? 'text-[#FF8990]' : 'text-accent';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={locked ? `${title}: ${subtitle}` : title}
      className={`relative flex min-h-26 min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left transition hover:brightness-125 active:opacity-75 ${coach ? 'border-[#71333C] bg-[#241419]' : 'border-[#24616A] bg-[#081A20]'}`}
    >
      <CardLighting color={coach ? RED : CYAN} />
      <img
        src={artwork}
        alt=""
        className={`pointer-events-none absolute object-contain ${coach ? 'right-0.5 -bottom-1 aspect-square w-[58%] max-w-29' : 'top-0.5 -right-1 size-26 opacity-85'}`}
      />
      <span className="relative flex items-center gap-2">
        <span className={`rounded-lg p-2 ${coach ? 'bg-[#472129]' : 'bg-[#10333C]'}`}>
          <Icon aria-hidden className={`size-5 ${accentText}`} />
        </span>
        {!locked && <ChevronRight aria-hidden className={`size-4 ${accentText}`} />}
      </span>
      <span className="relative flex flex-col gap-0.5">
        <span className="text-[15px] font-extrabold">{title}</span>
        {locked ? (
          <span
            className={`flex items-center gap-1 self-start rounded-lg border px-2 py-1 text-xs font-bold ${coach ? 'border-[#71333C] bg-[#29151B] text-[#FFBCC0]' : 'border-[#24616A] bg-[#081A20] text-[#A5F3FC]'}`}
          >
            <LockKeyhole aria-hidden className={`size-3.5 ${accentText}`} />
            {subtitle}
          </span>
        ) : (
          <span className={`text-[13px] text-[#B8BDC3] ${coach ? 'max-w-[60%]' : ''}`}>{subtitle}</span>
        )}
      </span>
    </button>
  );
}
