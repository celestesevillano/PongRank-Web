import { Send, Undo2 } from 'lucide-react';
import { useState } from 'react';

import { MatchResult } from '@/components/matches/match-result';
import { Button } from '@/components/ui/button';
import { MatchArt } from '@/lib/match-art';
import type { LiveMatchState, SetScore } from '@/types/api';
import { setsWon } from '@/utils/scoring';

type LiveScoreboardProps = {
  state: LiveMatchState;
  opponentName: string;
  player1IsMe: boolean;
  busy: boolean;
  submitting: boolean;
  onPoint: () => void;
  onUndo: () => void;
  onSubmit: (sets: SetScore[]) => void;
};

export function LiveScoreboard({ state, opponentName, player1IsMe, busy, submitting, onPoint, onUndo, onSubmit }: LiveScoreboardProps) {
  const [reviewing, setReviewing] = useState(false);
  const sets = state.completedSets;
  const won = setsWon(sets);
  const mySets = player1IsMe ? won.player1 : won.player2;
  const rivalSets = player1IsMe ? won.player2 : won.player1;

  if (reviewing && state.finished) {
    return (
      <div className="flex flex-col gap-3">
        <MatchResult
          title={mySets > rivalSets ? 'Ganaste la partida' : 'Terminó la partida'}
          message="Revisa los sets antes de enviar el resultado."
          score={`${mySets}–${rivalSets}`}
          art={MatchArt.send}
          sets={sets}
          reverse={!player1IsMe}
        />
        <Button icon={Send} loading={submitting} disabled={busy} onClick={() => onSubmit(sets)}>
          Enviar resultado
        </Button>
        <Button variant="text" disabled={submitting} onClick={() => setReviewing(false)}>
          Volver al marcador
        </Button>
      </div>
    );
  }

  const myPoints = player1IsMe ? state.scorePlayer1 : state.scorePlayer2;
  const rivalPoints = player1IsMe ? state.scorePlayer2 : state.scorePlayer1;
  const myLastPoint = state.lastPointBy === (player1IsMe ? 1 : 2);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-[15px] font-bold text-muted tabular-nums">
        Sets · {mySets}–{rivalSets}
      </p>
      {sets.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Sets terminados">
          {sets.map((set) => (
            <li key={set.setNumber} className="rounded-md border border-line px-2 py-0.5 text-[13px] text-muted tabular-nums">
              Set {set.setNumber} · {player1IsMe ? set.scorePlayer1 : set.scorePlayer2}–{player1IsMe ? set.scorePlayer2 : set.scorePlayer1}
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-[13px] text-muted">Set {sets.length + (state.finished ? 0 : 1)}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand/60 bg-brand/5 p-4">
          <p className="w-full truncate text-center font-bold">Tú</p>
          <p aria-live="polite" aria-label={`Tus puntos: ${myPoints}`} className="text-6xl font-extrabold text-brand tabular-nums">
            {myPoints}
          </p>
          <Button className="w-full" disabled={busy || submitting || state.finished} onClick={onPoint} aria-label="Sumar un punto propio">
            +1 punto
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-4">
          <p className="w-full truncate text-center font-bold">{opponentName}</p>
          <p aria-live="polite" aria-label={`Puntos de ${opponentName}: ${rivalPoints}`} className="text-6xl font-extrabold text-muted tabular-nums">
            {rivalPoints}
          </p>
          <p className="flex min-h-11 items-center text-center text-[13px] text-muted">Marcador del rival</p>
        </div>
      </div>
      <Button variant="secondary" icon={Undo2} disabled={busy || submitting || !myLastPoint} onClick={onUndo}>
        Deshacer último punto
      </Button>
      {state.finished && (
        <Button disabled={busy} onClick={() => setReviewing(true)}>
          Revisar marcador
        </Button>
      )}
    </div>
  );
}
