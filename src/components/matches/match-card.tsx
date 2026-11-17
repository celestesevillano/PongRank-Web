import { Clock, MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { MatchMeta } from '@/components/matches/match-meta';
import { PlayerIdentity } from '@/components/matches/player-identity';
import { paths } from '@/routes/paths';
import type { MatchResponse } from '@/types/api';
import { FORMAT_LABELS, matchPerspective, matchPlace, matchTime } from '@/utils/match-status';

const TONES = {
  win: 'text-[#93E6B0] border-[#347452] bg-[#12251D]',
  loss: 'text-[#FF9EA5] border-[#763840] bg-[#24171D]',
  waiting: 'text-gold border-[#675026] bg-[#241D16]',
  pending: 'text-[#9CEBF4] border-[#387584] bg-[#14262D]',
  neutral: 'text-white border-line bg-surface',
} as const;

function describe(match: MatchResponse, playerId: number) {
  const { proposedByMe, waitingForOpponent, isPlayer1, opponent } = matchPerspective(match, playerId);
  const proposed = match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2';
  const final = match.status === 'CONFIRMED';
  const won = match.winnerId === playerId;
  const tone: keyof typeof TONES = final && match.winnerId ? (won ? 'win' : 'loss') : waitingForOpponent ? 'waiting' : proposed ? 'pending' : 'neutral';
  const title = final
    ? match.winnerId
      ? won
        ? 'Victoria'
        : 'Derrota'
      : 'Finalizada'
    : proposed
      ? proposedByMe
        ? 'Resultado enviado'
        : 'Resultado por confirmar'
      : waitingForOpponent
        ? 'Esperando rival'
        : match.status === 'CREATED'
          ? 'Partida confirmada'
          : match.status === 'DISPUTED'
            ? 'En disputa'
            : match.status === 'CANCELLED'
              ? 'Cancelada'
              : 'Finalizada';
  const action = final ? 'Ver resultado' : proposed && !proposedByMe ? 'Revisar resultado' : 'Ver partida';
  const result = match.scoreSummary?.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  const score = result && !isPlayer1 && opponent ? `${result[2]}–${result[1]}` : match.scoreSummary?.replace('-', '–');
  return { tone, title, action, score, final, opponent };
}

export function MatchCard({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const { tone, title, action, score, final, opponent } = describe(match, playerId);
  const place = matchPlace(match);

  return (
    <Link
      to={paths.matchDetail(match.id)}
      className={`flex flex-col gap-1.5 rounded-[13px] border p-3 transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-accent ${TONES[tone]}`}
    >
      <span className={`self-start rounded-md border px-2 py-0.5 text-[11px] font-bold ${TONES[tone]}`}>{title}</span>
      <div className="flex items-center justify-between gap-2 text-white">
        {opponent ? (
          <PlayerIdentity player={opponent} showRating={!final} />
        ) : (
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex size-10.5 items-center justify-center rounded-full bg-[#382A16]">
              <UserRound className="size-5 text-gold" />
            </span>
            <span className="font-bold">Partida abierta</span>
          </div>
        )}
        {score && <span className="shrink-0 text-[21px] font-extrabold tabular-nums">{score}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{FORMAT_LABELS[match.format]}</span>
        <span className="text-xs font-bold text-accent">{action}</span>
      </div>
      {place && !final && <MatchMeta icon={MapPin} text={place} />}
      {match.scheduledAt && !final && <MatchMeta icon={Clock} text={matchTime(match.scheduledAt)} />}
    </Link>
  );
}
