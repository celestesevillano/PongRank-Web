import type { PlayerSummary } from '@/types/api';

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export function PlayerIdentity({ player, showRating = false }: { player: Pick<PlayerSummary, 'name' | 'ratingGlicko' | 'username'>; showRating?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="flex size-10.5 shrink-0 items-center justify-center rounded-full bg-graphite text-sm font-extrabold text-white">
        {initialsOf(player.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold">{player.name}</span>
        {showRating ? (
          <span className="block text-[13px] text-muted tabular-nums">{Math.round(player.ratingGlicko)} de rating</span>
        ) : (
          player.username && <span className="block truncate text-[13px] text-muted">@{player.username}</span>
        )}
      </span>
    </div>
  );
}
