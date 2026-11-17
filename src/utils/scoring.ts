import type { SetScore } from '@/types/api';

const POINTS_TO_WIN_SET = 11;
const MIN_LEAD = 2;

type Points = Pick<SetScore, 'scorePlayer1' | 'scorePlayer2'>;

export function setWinner({ scorePlayer1: a, scorePlayer2: b }: Points): 1 | 2 | null {
  if (Math.max(a, b) >= POINTS_TO_WIN_SET && Math.abs(a - b) >= MIN_LEAD) return a > b ? 1 : 2;
  return null;
}

export function setsWon(sets: Points[]) {
  return sets.reduce(
    (won, set) => {
      const winner = setWinner(set);
      if (winner === 1) won.player1 += 1;
      if (winner === 2) won.player2 += 1;
      return won;
    },
    { player1: 0, player2: 0 },
  );
}
