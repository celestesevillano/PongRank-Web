import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { MatchFormat, SetScore } from '@/types/api';
import { matchWinner, setWinner, setsWon, toSetScores } from '@/utils/scoring';

type ScoreEvent = 'player1' | 'player2' | 'nextSet';
type Points = { scorePlayer1: number; scorePlayer2: number };

type LiveScoreboardProps = {
  format: MatchFormat;
  myName: string;
  opponentName: string;
  player1IsMe: boolean;
  submitting: boolean;
  onSubmit: (sets: SetScore[]) => void;
};

function replay(events: ScoreEvent[]) {
  const finished: Points[] = [];
  let current: Points = { scorePlayer1: 0, scorePlayer2: 0 };
  for (const event of events) {
    if (event === 'nextSet') {
      finished.push(current);
      current = { scorePlayer1: 0, scorePlayer2: 0 };
    } else {
      const key = event === 'player1' ? 'scorePlayer1' : 'scorePlayer2';
      current = { ...current, [key]: current[key] + 1 };
    }
  }
  return { finished, current };
}

export function LiveScoreboard({ format, myName, opponentName, player1IsMe, submitting, onSubmit }: LiveScoreboardProps) {
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const { finished, current } = replay(events);

  const currentWinner = setWinner(current);
  const played = currentWinner ? [...finished, current] : finished;
  const matchOver = matchWinner(played, format) !== null;
  const won = setsWon(played);
  const me = player1IsMe ? 'player1' : 'player2';
  const them = player1IsMe ? 'player2' : 'player1';

  const push = (event: ScoreEvent) => setEvents((list) => [...list, event]);
  const points = (side: 'player1' | 'player2') => (side === 'player1' ? current.scorePlayer1 : current.scorePlayer2);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted">
        Set {finished.length + 1} · Sets {player1IsMe ? won.player1 : won.player2} – {player1IsMe ? won.player2 : won.player1}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ScoreColumn label={myName} value={points(me)} disabled={currentWinner !== null || submitting} onAdd={() => push(me)} />
        <ScoreColumn label={opponentName} value={points(them)} disabled={currentWinner !== null || submitting} onAdd={() => push(them)} />
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {currentWinner && !matchOver && <Button onClick={() => push('nextSet')}>Siguiente set</Button>}
        {matchOver && (
          <Button loading={submitting} onClick={() => onSubmit(toSetScores(played))}>
            Enviar resultado
          </Button>
        )}
        <Button variant="ghost" disabled={events.length === 0 || submitting} onClick={() => setEvents((list) => list.slice(0, -1))}>
          Deshacer último cambio
        </Button>
      </div>
    </div>
  );
}

function ScoreColumn({ label, value, disabled, onAdd }: { label: string; value: number; disabled: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-black/40 p-4">
      <p className="w-full truncate text-center font-bold">{label}</p>
      <p className="text-6xl font-extrabold text-brand tabular-nums" aria-label={`${label}: ${value} puntos`}>
        {value}
      </p>
      <button
        type="button"
        aria-label={`Sumar punto a ${label}`}
        disabled={disabled}
        onClick={onAdd}
        className="size-16 rounded-full border-2 border-brand text-lg font-extrabold text-brand transition hover:bg-brand hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand"
      >
        +1
      </button>
    </div>
  );
}
