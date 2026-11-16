import type { MatchSet } from '@/types/api';

type SetListProps = { sets: MatchSet[]; player1Name: string; player2Name: string };

export function SetList({ sets, player1Name, player2Name }: SetListProps) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Marcador por set</caption>
      <thead>
        <tr className="text-muted">
          <th scope="col" className="py-2 text-left font-semibold">
            Set
          </th>
          <th scope="col" className="truncate py-2 text-right font-semibold">
            {player1Name}
          </th>
          <th scope="col" className="truncate py-2 text-right font-semibold">
            {player2Name}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {sets.map((set) => (
          <tr key={set.id}>
            <th scope="row" className="py-2 text-left font-normal text-muted">
              {set.setNumber}
            </th>
            <td className={`py-2 text-right tabular-nums ${set.winnerPlayerNumber === 1 ? 'font-extrabold' : 'text-muted'}`}>{set.scorePlayer1}</td>
            <td className={`py-2 text-right tabular-nums ${set.winnerPlayerNumber === 2 ? 'font-extrabold' : 'text-muted'}`}>{set.scorePlayer2}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
