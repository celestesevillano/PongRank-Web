import { useState } from 'react';

import { LiveScoreboard } from '@/components/matches/live-scoreboard';
import { ManualScoreForm } from '@/components/matches/manual-score-form';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import type { MatchFormat, SetScore } from '@/types/api';

type Mode = 'live' | 'manual';

type ScoreRecorderProps = {
  format: MatchFormat;
  myName: string;
  opponentName: string;
  player1IsMe: boolean;
  submitting: boolean;
  onSubmit: (sets: SetScore[]) => void;
};

export function ScoreRecorder(props: ScoreRecorderProps) {
  const [mode, setMode] = useState<Mode>('live');

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Registrar marcador</h2>
        <Tabs<Mode>
          tabs={[
            { value: 'live', label: 'En vivo' },
            { value: 'manual', label: 'Ya jugamos' },
          ]}
          active={mode}
          onChange={setMode}
        />
      </div>
      {mode === 'live' ? <LiveScoreboard {...props} /> : <ManualScoreForm {...props} />}
    </Card>
  );
}
