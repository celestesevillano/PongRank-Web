import type { MatchFormat, SetScore } from '@/types/api';

const POINTS_TO_WIN_SET = 11;
const MIN_LEAD = 2;

export const SETS_TO_WIN: Record<MatchFormat, number> = { BO3: 2, BO5: 3, BO7: 4 };
export const MAX_SETS: Record<MatchFormat, number> = { BO3: 3, BO5: 5, BO7: 7 };

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

export function matchWinner(sets: Points[], format: MatchFormat): 1 | 2 | null {
  const won = setsWon(sets);
  if (won.player1 >= SETS_TO_WIN[format]) return 1;
  if (won.player2 >= SETS_TO_WIN[format]) return 2;
  return null;
}

export function validateSet({ scorePlayer1: a, scorePlayer2: b }: Points): string | null {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return 'Usa puntos enteros desde 0.';
  if (a === b) return 'Un set no puede terminar empatado.';
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  if (high < POINTS_TO_WIN_SET) return 'El ganador del set necesita al menos 11 puntos.';
  if (low < POINTS_TO_WIN_SET - 1 && high !== POINTS_TO_WIN_SET) return 'Si el rival no llegó a 10, el set termina en 11.';
  if (low >= POINTS_TO_WIN_SET - 1 && high !== low + MIN_LEAD) return 'Desde 10-10 el set termina con exactamente 2 puntos de ventaja.';
  return null;
}

export function validateMatch(sets: Points[], format: MatchFormat): string | null {
  if (sets.length === 0) return 'Registra al menos un set.';
  if (sets.length > MAX_SETS[format]) return `El formato ${format} admite como máximo ${MAX_SETS[format]} sets.`;
  for (let index = 0; index < sets.length; index++) {
    const setError = validateSet(sets[index]);
    if (setError) return `Set ${index + 1}: ${setError}`;
    if (index < sets.length - 1 && matchWinner(sets.slice(0, index + 1), format)) {
      return `La partida terminó en el set ${index + 1}; quita los sets sobrantes.`;
    }
  }
  if (!matchWinner(sets, format)) return `Nadie ha ganado ${SETS_TO_WIN[format]} sets todavía.`;
  return null;
}

export const toSetScores = (sets: Points[]): SetScore[] => sets.map((set, index) => ({ setNumber: index + 1, ...set }));
