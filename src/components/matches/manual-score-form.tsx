import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import type { MatchFormat, SetScore } from '@/types/api';
import { MAX_SETS, SETS_TO_WIN, toSetScores, validateMatch, validateSet } from '@/utils/scoring';

type DraftSet = { mine: string; theirs: string };

type ManualScoreFormProps = {
  format: MatchFormat;
  myName: string;
  opponentName: string;
  player1IsMe: boolean;
  submitting: boolean;
  onSubmit: (sets: SetScore[]) => void;
};

const emptySet = (): DraftSet => ({ mine: '', theirs: '' });
const isFilled = (set: DraftSet) => set.mine !== '' && set.theirs !== '';

export function ManualScoreForm({ format, myName, opponentName, player1IsMe, submitting, onSubmit }: ManualScoreFormProps) {
  const [drafts, setDrafts] = useState<DraftSet[]>(() => Array.from({ length: SETS_TO_WIN[format] }, emptySet));

  const toPoints = (set: DraftSet) => {
    const mine = Number(set.mine);
    const theirs = Number(set.theirs);
    return player1IsMe ? { scorePlayer1: mine, scorePlayer2: theirs } : { scorePlayer1: theirs, scorePlayer2: mine };
  };

  const filled = drafts.filter(isFilled);
  const matchError = filled.length === drafts.length ? validateMatch(drafts.map(toPoints), format) : null;
  const canSubmit = filled.length === drafts.length && matchError === null;

  const update = (index: number, side: keyof DraftSet, value: string) =>
    setDrafts((list) => list.map((set, i) => (i === index ? { ...set, [side]: value.replace(/\D/g, '').slice(0, 2) } : set)));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit(toSetScores(drafts.map(toPoints)));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-1 text-sm">
        <span />
        <span className="truncate text-center font-bold">{myName}</span>
        <span className="truncate text-center font-bold">{opponentName}</span>
        {drafts.map((set, index) => {
          const setError = isFilled(set) ? validateSet(toPoints(set)) : null;
          return (
            <div key={index} className="contents">
              <span className="text-muted">Set {index + 1}</span>
              <ScoreInput label={`Set ${index + 1}, puntos de ${myName}`} value={set.mine} invalid={setError !== null} onChange={(v) => update(index, 'mine', v)} />
              <ScoreInput label={`Set ${index + 1}, puntos de ${opponentName}`} value={set.theirs} invalid={setError !== null} onChange={(v) => update(index, 'theirs', v)} />
              {setError && <p className="col-span-3 text-right text-xs text-brand">{setError}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={drafts.length >= MAX_SETS[format]} onClick={() => setDrafts((list) => [...list, emptySet()])}>
          Añadir set
        </Button>
        <Button type="button" variant="text" disabled={drafts.length <= SETS_TO_WIN[format]} onClick={() => setDrafts((list) => list.slice(0, -1))}>
          Quitar set
        </Button>
      </div>
      {matchError && <p className="text-sm text-brand" role="alert">{matchError}</p>}
      <Button type="submit" loading={submitting} disabled={!canSubmit}>
        Enviar resultado
      </Button>
    </form>
  );
}

function ScoreInput({ label, value, invalid, onChange }: { label: string; value: string; invalid: boolean; onChange: (value: string) => void }) {
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      placeholder="0"
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-xl border bg-black px-3 py-2 text-center text-lg font-bold tabular-nums outline-none focus:border-accent ${invalid ? 'border-brand' : 'border-line'}`}
    />
  );
}
