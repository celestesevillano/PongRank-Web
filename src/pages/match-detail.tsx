import { CalendarClock, ChevronLeft, Clock, Flag, History, MapPin, Search, Share2, Swords, Users } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Spinner } from '@/components/common/spinner';
import { LiveScoreboard } from '@/components/matches/live-scoreboard';
import { MatchBanner } from '@/components/matches/match-banner';
import { MatchMeta } from '@/components/matches/match-meta';
import { MatchNotice } from '@/components/matches/match-notice';
import { MatchResult } from '@/components/matches/match-result';
import { MatchState } from '@/components/matches/match-state';
import { PlayerIdentity } from '@/components/matches/player-identity';
import { WhatsAppLink } from '@/components/matches/whatsapp-link';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useLiveMatch } from '@/hooks/use-live-match';
import { MatchArt } from '@/lib/match-art';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { matchesService } from '@/services/matches.service';
import type { MatchDetail, SetScore } from '@/types/api';
import { isRetryable, toApiError } from '@/utils/api-error';
import { FORMAT_LABELS, matchPlace, matchSource, matchTime } from '@/utils/match-status';
import { setsWon } from '@/utils/scoring';
import { shareText } from '@/utils/share';

const AWAITING_POLL_MS = 10_000;
const RATING_POLL_MS = 2000;
const RATING_POLL_ATTEMPTS = 5;
const MAX_REASON = 500;

type Stage = 'confirmation' | 'ready';

export default function MatchDetailPage() {
  const matchId = Number(useParams().id);
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return (
      <MatchState title="Esa partida no existe" art={MatchArt.search}>
        <ButtonLink to={paths.matches} variant="text">
          Ver mis partidas
        </ButtonLink>
      </MatchState>
    );
  }
  return <MatchLoader matchId={matchId} />;
}

function MatchLoader({ matchId }: { matchId: number }) {
  const match = useFetch((signal) => matchesService.get(matchId, signal), [matchId]);
  const data = match.data;
  const awaitingChange = !!data && ((data.status === 'CREATED' && !data.player2) || data.status === 'PROPOSED_P1' || data.status === 'PROPOSED_P2');
  const { refetch } = match;

  useEffect(() => {
    if (!awaitingChange) return;
    const timer = setInterval(() => !document.hidden && refetch(), AWAITING_POLL_MS);
    return () => clearInterval(timer);
  }, [awaitingChange, refetch]);

  if (data && data.id === matchId) return <MatchContent key={matchId} match={data} onChanged={refetch} />;
  if (match.error) {
    return (
      <MatchState title={match.error.isNetwork ? 'Problema de conexión' : 'No pudimos abrir la partida'} message={match.error.message} art={match.error.isNetwork ? MatchArt.offline : MatchArt.search}>
        {isRetryable(match.error) ? (
          <Button variant="secondary" onClick={refetch}>
            Reintentar
          </Button>
        ) : (
          <ButtonLink to={paths.matches} variant="text">
            Ver mis partidas
          </ButtonLink>
        )}
      </MatchState>
    );
  }
  return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );
}

function MatchContent({ match, onChanged }: { match: MatchDetail; onChanged: () => void }) {
  const { player, updateLocalPlayer } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const reasonId = useId();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('confirmation');
  const [disputing, setDisputing] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [reason, setReason] = useState('');

  const first = match.player1.id === player!.id;
  const participating = first || match.player2?.id === player!.id;
  const opponent = first ? match.player2 : match.player1;
  const proposed = match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2';
  const myProposal = participating && match.status === (first ? 'PROPOSED_P1' : 'PROPOSED_P2');
  const mayReview = participating && proposed && !myProposal;
  const canPlay = participating && match.status === 'CREATED' && !!match.player2 && !!opponent;
  const live = useLiveMatch(match.id, canPlay && stage === 'ready', onChanged);
  const myReady = first ? live.state?.player1Ready : live.state?.player2Ready;
  const theirReady = first ? live.state?.player2Ready : live.state?.player1Ready;
  const playing = !!(myReady && theirReady && live.state?.status === 'CREATED');
  const final = match.status === 'CONFIRMED';
  const waitingRival = match.status === 'CREATED' && !match.player2;
  const place = matchPlace(match);
  const time = matchTime(match.scheduledAt ?? match.createdAt);
  const name = opponent?.name ?? 'Tu rival';
  const source = match.tournamentName ?? matchSource(match);
  const count = setsWon(match.sets);
  const score = match.sets.length ? (first || !participating ? `${count.player1}–${count.player2}` : `${count.player2}–${count.player1}`) : match.scoreSummary;
  const winner = match.winnerId === match.player1.id ? match.player1.name : match.player2?.name;
  const proposedWinner = count.player1 > count.player2 ? match.player1.name : match.player2?.name;
  const didWin = participating && match.winnerId === player!.id;
  const ratingDelta = first ? match.ratingDeltaP1 : match.ratingDeltaP2;
  const ratingPending = participating && final && ratingDelta === null;

  useRatingRefresh(ratingPending, onChanged);

  useEffect(() => {
    if (!participating || !final || ratingDelta === null) return;
    const controller = new AbortController();
    authService.me(controller.signal).then(updateLocalPlayer, () => undefined);
    return () => controller.abort();
  }, [participating, final, ratingDelta, updateLocalPlayer]);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      setDisputing(false);
      setCancelPrompt(false);
      if (success) toast.show(success, 'success');
      onChanged();
    } catch (err) {
      const apiError = toApiError(err);
      toast.show(apiError.message, 'error');
      if (apiError.status === 409) onChanged();
    } finally {
      setBusy(false);
    }
  };

  const share = (text: string) =>
    shareText(text).then(
      (result) => result === 'copied' && toast.show('Enlace copiado. Pégalo donde quieras compartirlo.', 'success'),
      (err: unknown) => err instanceof DOMException && err.name === 'AbortError' ? undefined : toast.show('No pudimos compartir la partida.', 'error'),
    );

  const matchInfo = (
    <div className="flex flex-col gap-1.5">
      <MatchMeta icon={Users} text={source} tone="brand" />
      {place && <MatchMeta icon={MapPin} text={place} tone="brand" />}
      <MatchMeta icon={CalendarClock} text={time} tone="brand" />
      <MatchMeta icon={Swords} text={FORMAT_LABELS[match.format]} tone="brand" />
    </div>
  );

  let body: ReactNode;
  let actions: ReactNode = null;

  if (canPlay && opponent && stage === 'confirmation') {
    body = (
      <Panel highlighted>
        <MatchState title="¡Partida confirmada!" art={MatchArt.confirmed}>
          <PlayerIdentity player={opponent} showRating />
          {matchInfo}
        </MatchState>
      </Panel>
    );
    actions = (
      <>
        <Button icon={Swords} className="flex-1" onClick={() => setStage('ready')}>
          Empezar partida
        </Button>
        {opponent.whatsapp && <WhatsAppLink phone={opponent.whatsapp} opponentName={opponent.name} />}
      </>
    );
  } else if (canPlay && !playing) {
    const ready = !!myReady;
    body = (
      <>
        <h1 className="text-[26px] font-extrabold">Antes de jugar</h1>
        <MatchBanner title={match.tournamentName ?? 'Partida amistosa'}>{matchInfo}</MatchBanner>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <img src={MatchArt.versus} alt="" className="absolute inset-0 size-full object-cover object-bottom opacity-60" />
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5">
            <ReadyPlayer label="Tú" ready={ready} />
            <span className="rounded-full bg-brand px-3 py-2 text-lg font-black">VS</span>
            <ReadyPlayer label={name} ready={!!theirReady} />
          </div>
        </div>
        {ready ? (
          <MatchNotice icon={Clock} title={`Esperando a ${name}`} message="El marcador se abrirá cuando ambos estén listos." />
        ) : (
          <p className="text-[15px] text-muted">Confirma que estás listo para empezar.</p>
        )}
      </>
    );
    actions = (
      <>
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => setCancelPrompt(true)}>
          Rechazar partida
        </Button>
        <Button className="flex-1" disabled={ready || !live.state} loading={live.busy} onClick={() => live.perform('READY')}>
          {ready ? 'Esperando al rival' : 'Estoy listo'}
        </Button>
      </>
    );
  } else if (canPlay && live.state) {
    body = (
      <>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="truncate text-[26px] font-extrabold">vs. {name}</h1>
          <span className="shrink-0 text-[15px] text-muted">{FORMAT_LABELS[match.format]}</span>
        </div>
        <LiveScoreboard
          state={live.state}
          opponentName={name}
          player1IsMe={first}
          busy={live.busy}
          submitting={busy}
          onPoint={() => live.perform('POINT')}
          onUndo={() => live.perform('UNDO')}
          onSubmit={(sets: SetScore[]) => run(() => matchesService.submitScore(match.id, sets), 'Resultado enviado. Falta que tu rival lo confirme.')}
        />
      </>
    );
  } else if (waitingRival) {
    body = (
      <>
        <Panel highlighted>
          <MatchState title="Esperando rival" message="Tu partida está abierta. Comparte la invitación para que alguien se sume." art={MatchArt.rival} />
          {matchInfo}
        </Panel>
        <Button variant="secondary" icon={Share2} onClick={() => share(`¿Jugamos ping-pong? Partida abierta en PongRank · ${FORMAT_LABELS[match.format]}`)}>
          Compartir invitación
        </Button>
      </>
    );
    actions = (
      <>
        {participating && (
          <Button className="flex-1" disabled={busy} onClick={() => setCancelPrompt(true)}>
            Cancelar partida
          </Button>
        )}
        <ButtonLink to={paths.matches} variant="secondary" className="flex-1">
          Ver mis partidas
        </ButtonLink>
      </>
    );
  } else if (match.status === 'CANCELLED') {
    body = <MatchState title="Partida cancelada" message="Puedes buscar otra o crear una nueva." art={MatchArt.cancelled} />;
    actions = (
      <>
        <ButtonLink to={paths.newMatch} replace className="flex-1">
          Nueva partida
        </ButtonLink>
        <ButtonLink to={paths.findMatch} replace variant="secondary" icon={Search} className="flex-1">
          Buscar partida
        </ButtonLink>
      </>
    );
  } else if (mayReview && disputing) {
    body = (
      <>
        <h1 className="text-[26px] font-extrabold">Disputar resultado</h1>
        <Panel>
          <p className="font-bold">vs. {name}</p>
          <p className="text-[13px] text-muted">Resultado propuesto · {score}</p>
        </Panel>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={reasonId} className="font-bold">
            Motivo de la disputa
          </label>
          <textarea
            id={reasonId}
            value={reason}
            maxLength={MAX_REASON}
            rows={4}
            disabled={busy}
            placeholder="Describe qué pasó"
            onChange={(event) => setReason(event.target.value)}
            className="resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-white outline-none placeholder:text-muted focus:border-accent"
          />
          <p className="self-end text-[13px] text-muted tabular-nums">
            {reason.length}/{MAX_REASON}
          </p>
        </div>
      </>
    );
    actions = (
      <>
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => setDisputing(false)}>
          Volver
        </Button>
        <Button className="flex-1" loading={busy} disabled={!reason.trim()} onClick={() => run(() => matchesService.dispute(match.id, reason.trim()), 'Disputa enviada.')}>
          Enviar disputa
        </Button>
      </>
    );
  } else if (match.status === 'DISPUTED') {
    body = (
      <>
        <h1 className="text-[26px] font-extrabold">Resultado en disputa</h1>
        <MatchNotice icon={Flag} title="Resultado pendiente" message="El marcador reportado sigue en revisión y no cuenta para el ranking." />
        {match.disputeReason && <p className="text-[15px] text-muted">{match.disputeReason}</p>}
        <p className="font-bold">Marcador reportado</p>
        <Panel>
          <ul className="divide-y divide-line">
            {match.sets.map((set) => (
              <li key={set.setNumber} className="flex justify-between py-1.5 font-bold tabular-nums">
                <span>Set {set.setNumber}</span>
                <span>
                  {set.scorePlayer1}–{set.scorePlayer2}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </>
    );
  } else if (final || proposed) {
    const title = final ? (didWin ? '¡Ganaste la partida!' : 'Partida finalizada') : myProposal ? 'Resultado enviado' : proposedWinner ? `${proposedWinner} ganó la partida` : 'Revisar resultado';
    const message = final
      ? `${winner ? `Ganó ${winner}` : 'Resultado confirmado'}${participating ? ` · ${ratingPending ? 'Actualizando tu ranking…' : `Tu rating: ${(ratingDelta ?? 0) >= 0 ? '+' : ''}${Math.round(ratingDelta ?? 0)}`}` : ''}`
      : myProposal
        ? 'Tu rival puede confirmar o disputar el marcador.'
        : 'Revisa los sets antes de confirmar el resultado.';
    body = (
      <MatchResult
        title={title}
        message={message}
        art={final ? (didWin ? MatchArt.win : MatchArt.loss) : myProposal ? MatchArt.sent : MatchArt.review}
        score={score}
        sets={match.sets}
        reverse={participating && !first}
        gold={didWin && final}
      />
    );
    if (mayReview) {
      actions = (
        <>
          <Button className="flex-1" loading={busy} onClick={() => run(() => matchesService.confirm(match.id), 'Resultado confirmado. Actualizando tu ranking…')}>
            Confirmar
          </Button>
          <Button variant="secondary" icon={Flag} className="flex-1" disabled={busy} onClick={() => setDisputing(true)}>
            Disputar
          </Button>
        </>
      );
    } else if (final && didWin) {
      actions = (
        <>
          <Button variant="secondary" icon={Share2} className="flex-1" onClick={() => share(`¡Gané ${score ?? ''} en PongRank! 🏓`)}>
            Compartir
          </Button>
          <ButtonLink to={`${paths.matches}?tab=history`} icon={History} className="flex-1">
            Ver historial
          </ButtonLink>
        </>
      );
    }
  } else {
    body = (
      <MatchState
        title={match.status === 'WALKOVER' ? 'Partida finalizada por incomparecencia' : 'Detalle de la partida'}
        message={match.tournamentName ?? match.communityName ?? name}
        art={MatchArt.tournaments}
      />
    );
  }

  const goBack = () => {
    if (disputing) setDisputing(false);
    else if (canPlay && stage !== 'confirmation' && !playing) setStage('confirmation');
    else navigate(-1);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Button variant="text" icon={ChevronLeft} className="-ml-2 self-start" disabled={busy} onClick={goBack}>
        Volver
      </Button>
      {body}
      {canPlay && stage === 'ready' && live.error && (
        <MatchNotice
          icon={Clock}
          title="Marcador en vivo"
          message={live.error.isNetwork ? 'Se perdió la conexión. Estamos intentando reconectar.' : live.error.status === 409 ? 'El marcador cambió. Revisa el último punto y vuelve a intentar.' : 'No pudimos actualizar el marcador. Revisa el estado antes de continuar.'}
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        {actions ?? (
          <ButtonLink to={final ? `${paths.matches}?tab=history` : paths.matches} className="flex-1">
            {final ? 'Ver historial' : 'Ver mis partidas'}
          </ButtonLink>
        )}
      </div>
      <ConfirmDialog
        open={cancelPrompt}
        title="¿Cancelar la partida?"
        message="La partida dejará de estar activa y no contará para el ranking."
        confirmLabel="Cancelar partida"
        loading={busy}
        onConfirm={() => run(() => matchesService.cancel(match.id), 'Partida cancelada.')}
        onCancel={() => setCancelPrompt(false)}
      />
    </div>
  );
}

function Panel({ children, highlighted = false }: { children: ReactNode; highlighted?: boolean }) {
  if (highlighted) {
    return (
      <div className="relative isolate flex flex-col gap-3 p-4">
        <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 -z-10 size-80 -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(232,38,47,0.28), transparent)' }} />
        {children}
      </div>
    );
  }
  return <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">{children}</div>;
}

function ReadyPlayer({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <p className="line-clamp-2 font-bold">{label}</p>
      <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${ready ? 'border-success/60 text-success' : 'border-line text-muted'}`}>{ready ? 'Listo' : 'Por confirmar'}</span>
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
