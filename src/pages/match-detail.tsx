import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { DisputeDialog } from '@/components/matches/dispute-dialog';
import { MatchStatusBadge } from '@/components/matches/match-status-badge';
import { ScoreRecorder } from '@/components/matches/score-recorder';
import { SetList } from '@/components/matches/set-list';
import { WhatsAppLink } from '@/components/matches/whatsapp-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { authService } from '@/services/auth.service';
import { matchesService } from '@/services/matches.service';
import type { MatchDetail, SetScore } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { FORMAT_LABELS, matchPerspective } from '@/utils/match-status';

const RATING_POLL_MS = 2000;
const RATING_POLL_ATTEMPTS = 5;

type PendingAction = 'confirm' | 'dispute' | 'cancel' | null;

export default function MatchDetailPage() {
  const matchId = Number(useParams().id);
  const match = useFetch((signal) => matchesService.get(matchId, signal), [matchId]);

  return (
    <ScreenState {...match} onRetry={match.refetch}>
      {(data) => <MatchContent match={data} onChanged={match.refetch} />}
    </ScreenState>
  );
}

function MatchContent({ match, onChanged }: { match: MatchDetail; onChanged: () => void }) {
  const { player, updateLocalPlayer } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const view = matchPerspective(match, player!.id);
  const opponentName = view.opponent?.name ?? 'Rival por definir';
  const title = view.isParticipant ? `Tú vs ${opponentName}` : `${match.player1.name} vs ${match.player2?.name ?? 'Rival por definir'}`;
  const ratingPending = view.isParticipant && match.status === 'CONFIRMED' && view.ratingDelta === null;

  useRatingRefresh(ratingPending, onChanged);

  useEffect(() => {
    if (!view.isParticipant || match.status !== 'CONFIRMED' || view.ratingDelta === null) return;
    const controller = new AbortController();
    authService.me(controller.signal).then(updateLocalPlayer, () => undefined);
    return () => controller.abort();
  }, [view.isParticipant, match.status, view.ratingDelta, updateLocalPlayer]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.show(success, 'success');
      setPending(null);
      onChanged();
    } catch (err) {
      const apiError = toApiError(err);
      toast.show(apiError.message, 'error');
      if (apiError.status === 409) {
        setPending(null);
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const submitScore = (sets: SetScore[]) =>
    run(() => matchesService.submitScore(match.id, sets), 'Resultado enviado. Falta que tu rival lo confirme.');

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <MatchStatusBadge status={match.status} />
        </div>
        <p className="text-sm text-muted">
          {FORMAT_LABELS[match.format]} · {match.communityName ?? match.tournamentName ?? 'Partida libre'} ·{' '}
          {new Date(match.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </header>

      <StatusMessage match={match} view={view} ratingPending={ratingPending} />

      {view.isParticipant && view.opponent?.whatsapp && match.status !== 'CANCELLED' && match.status !== 'WALKOVER' && (
        <WhatsAppLink phone={view.opponent.whatsapp} opponentName={view.opponent.name} />
      )}

      {view.canScore && (
        <ScoreRecorder format={match.format} myName={player!.name} opponentName={opponentName} player1IsMe={view.isPlayer1} submitting={busy} onSubmit={submitScore} />
      )}

      {!view.canScore && match.sets.length > 0 && (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Marcador</h2>
            {match.scoreSummary && <span className="text-lg font-extrabold">{match.scoreSummary}</span>}
          </div>
          <SetList sets={match.sets} player1Name={match.player1.name} player2Name={match.player2?.name ?? 'Rival'} />
        </Card>
      )}

      {view.awaitingMyReview && (
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => setPending('confirm')}>
            Confirmar resultado
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setPending('dispute')}>
            Disputar
          </Button>
        </div>
      )}

      {view.canCancel && (
        <Button variant="ghost" className="self-start" disabled={busy} onClick={() => setPending('cancel')}>
          Cancelar partida
        </Button>
      )}

      <ConfirmDialog
        open={pending === 'confirm'}
        title="Confirmar resultado"
        message={`Confirmas el marcador ${match.scoreSummary ?? ''} contra ${opponentName}. Se actualizará el ranking de ambos y ya no podrá modificarse.`}
        confirmLabel="Confirmar"
        loading={busy}
        onConfirm={() => run(() => matchesService.confirm(match.id), 'Resultado confirmado. Actualizando tu ranking…')}
        onCancel={() => setPending(null)}
      />
      <DisputeDialog
        open={pending === 'dispute'}
        loading={busy}
        onSubmit={(reason) => run(() => matchesService.dispute(match.id, reason), 'Disputa enviada.')}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === 'cancel'}
        title="Cancelar partida"
        message="La partida dejará de estar disponible y no contará para el ranking. Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        loading={busy}
        onConfirm={() => run(() => matchesService.cancel(match.id), 'Partida cancelada.')}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function useRatingRefresh(active: boolean, refetch: () => void) {
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!active || attempts >= RATING_POLL_ATTEMPTS) return;
    const timer = setTimeout(() => {
      setAttempts((count) => count + 1);
      refetch();
    }, RATING_POLL_MS);
    return () => clearTimeout(timer);
  }, [active, attempts, refetch]);
}

type StatusMessageProps = { match: MatchDetail; view: ReturnType<typeof matchPerspective>; ratingPending: boolean };

function StatusMessage({ match, view, ratingPending }: StatusMessageProps) {
  if (view.waitingForOpponent) return <Notice>Esperando que un rival se una a tu partida.</Notice>;
  if (view.proposedByMe) return <Notice>Enviaste el resultado. Falta que tu rival lo confirme o lo dispute.</Notice>;
  if (view.awaitingMyReview) return <Notice tone="action">Tu rival registró este resultado. Revísalo y confírmalo o dispútalo.</Notice>;
  if (match.status === 'DISPUTED') return <Notice tone="danger">Resultado en disputa: {match.disputeReason ?? 'sin motivo indicado'}.</Notice>;
  if (match.status === 'CANCELLED') return <Notice>Esta partida fue cancelada.</Notice>;
  if (match.status === 'WALKOVER') return <Notice>Partida cerrada por incomparecencia (W.O.).</Notice>;
  if (match.status !== 'CONFIRMED') return null;
  if (!view.isParticipant) return <Notice tone="success">Partida confirmada.</Notice>;

  if (ratingPending) return <Notice tone="success">{view.iWon ? '¡Ganaste!' : 'Partida confirmada.'} Actualizando tu ranking…</Notice>;

  const delta = Math.round(view.ratingDelta ?? 0);
  return (
    <Notice tone="success">
      {view.iWon ? '¡Ganaste!' : 'Partida confirmada.'} Tu rating cambió{' '}
      <strong className={delta >= 0 ? 'text-emerald-300' : 'text-red-300'}>
        {delta >= 0 ? '+' : ''}
        {delta}
      </strong>{' '}
      puntos.
    </Notice>
  );
}

const NOTICE_TONES = {
  info: 'border-line text-muted',
  action: 'border-brand/60 text-white',
  success: 'border-emerald-400/40 text-emerald-100',
  danger: 'border-red-400/60 text-red-200',
} as const;

function Notice({ tone = 'info', children }: { tone?: keyof typeof NOTICE_TONES; children: ReactNode }) {
  return (
    <p role="status" className={`rounded-xl border bg-surface px-4 py-3 text-sm ${NOTICE_TONES[tone]}`}>
      {children}
    </p>
  );
}
