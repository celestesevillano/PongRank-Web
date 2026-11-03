import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';
import { toApiError } from '@/utils/api-error';

export default function MatchDetailPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const { player } = useSession();
  const toast = useToast();
  const match = useFetch((signal) => matchesService.get(matchId, signal), [matchId]);
  const [busy, setBusy] = useState(false);

  const act = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.show(success, 'success');
      match.refetch();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenState {...match} onRetry={match.refetch}>
      {(data) => {
        const awaitingMe =
          (data.status === 'PROPOSED_P1' && data.player2?.id === player!.id) ||
          (data.status === 'PROPOSED_P2' && data.player1.id === player!.id);

        return (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-extrabold">
              {data.player1.name} vs {data.player2?.name ?? 'Rival por definir'}
            </h1>
            <Card>
              <p className="text-sm text-muted">
                {data.format} · {data.communityName ?? data.tournamentName ?? 'Partida libre'} · {data.status}
              </p>
              <ul className="mt-3 divide-y divide-line">
                {data.sets.map((set) => (
                  <li key={set.id} className="flex justify-between py-2">
                    <span className="text-muted">Set {set.setNumber}</span>
                    <span className="font-bold">
                      {set.scorePlayer1} – {set.scorePlayer2}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            {awaitingMe && (
              <div className="flex gap-3">
                <Button loading={busy} onClick={() => act(() => matchesService.confirm(matchId), 'Resultado confirmado.')}>
                  Confirmar resultado
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() => act(() => matchesService.dispute(matchId, 'Resultado incorrecto'), 'Disputa enviada.')}
                >
                  Disputar
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </ScreenState>
  );
}
