import type { LucideIcon } from 'lucide-react';

export function MatchNotice({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message: string }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl border border-[#2B7A89] bg-[#102931] p-3">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="flex flex-col gap-0.5">
        <p className="font-bold text-accent">{title}</p>
        <p className="text-[13px] leading-[18px] text-white">{message}</p>
      </div>
    </div>
  );
}
