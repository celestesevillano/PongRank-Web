import { MatchState } from '@/components/matches/match-state';
import type { SetScore } from '@/types/api';

type MatchResultProps = { title: string; message?: string; art: string; score?: string | null; sets: SetScore[]; reverse?: boolean; gold?: boolean };

export function MatchResult({ title, message, art, score, sets, reverse = false, gold = false }: MatchResultProps) {
  return (
    <div className={gold ? 'rounded-[18px] border border-[#9D742F] bg-[#2D1B17] py-3' : undefined}>
      <MatchState title={title} message={message} art={art}>
        {score && <p className={`text-[58px] leading-none font-black tabular-nums ${gold ? 'text-gold' : 'text-brand'}`}>{score}</p>}
        {sets.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Sets">
            {sets.map((set) => (
              <li key={set.setNumber} className="rounded-[7px] border border-[#2C6873] px-1.5 py-1 text-[13px] text-[#A9F1F9] tabular-nums">
                Set {set.setNumber} · {reverse ? set.scorePlayer2 : set.scorePlayer1}–{reverse ? set.scorePlayer1 : set.scorePlayer2}
              </li>
            ))}
          </ul>
        )}
      </MatchState>
    </div>
  );
}
