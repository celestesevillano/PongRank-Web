import { ChevronLeft, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';

export default function BracketPage() {
  const { id } = useParams();
  const tournamentId = Number(id);
  const matches = useFetch((signal) => matchesService.tournamentMatches(tournamentId, signal), [tournamentId]);
  const list = matches.data ?? [];
  const rounds = [...new Set(list.map((m) => m.round ?? 1))].sort((a, b) => a - b);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Link to="/matches/tournaments" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Cuadro</h1>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <img src="/illustrations/partidas/partidas-tournament.webp" alt="" className="w-40" />
          <p className="text-sm text-muted">El cuadro todavía no tiene partidos.</p>
        </div>
      ) : (
        <div className="flex items-stretch gap-0 overflow-x-auto pb-4">
          {rounds.map((round, index) => {
            const bouts = list.filter((m) => (m.round ?? 1) === round);
            const isFinal = index === rounds.length - 1;
            return (
              <div key={round} className="flex min-w-56 flex-col">
                <p className="mb-3 text-center text-xs font-bold text-[#FFD278]">{isFinal ? 'Final' : `Ronda ${round}`}</p>
                <div className="flex flex-1 flex-col justify-around gap-4">
                  {bouts.map((match) => (
                    <div key={match.id} className="relative">
                      <div className={`rounded-xl border bg-[#1A1408] p-3 ${isFinal ? 'border-[#FFD278]' : 'border-[#715426]'}`}>
                        <Slot name={match.player1?.name} />
                        <div className="my-1 h-px bg-[#715426]" />
                        <Slot name={match.player2?.name} />
                        {match.scoreSummary && <p className="mt-1 text-center text-xs font-bold text-[#FFD278]">{match.scoreSummary}</p>}
                      </div>
                      {!isFinal && <span className="absolute top-1/2 -right-3 h-px w-3 bg-[#715426]" />}
                    </div>
                  ))}
                </div>
                {isFinal && <Trophy className="mx-auto mt-3 size-6 text-[#FFD278]" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Slot({ name }: { name?: string }) {
  return <p className="truncate text-sm font-bold">{name ?? 'Por definir'}</p>;
}
