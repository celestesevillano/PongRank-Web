import { ChevronLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';

export default function BracketPage() {
  const { id } = useParams();
  const tournamentId = Number(id);
  const matches = useFetch((signal) => matchesService.tournamentMatches(tournamentId, signal), [tournamentId]);
  const list = matches.data ?? [];
  const rounds = [...new Set(list.map((m) => m.round ?? 1))].sort((a, b) => a - b);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Link to="/matches/tournaments" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Cuadro</h1>
      {list.length === 0 ? (
        <p className="text-sm text-muted">El cuadro todavía no tiene partidos.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {rounds.map((round) => (
            <div key={round} className="flex min-w-52 flex-col gap-3">
              <p className="text-xs font-bold text-muted">Ronda {round}</p>
              {list.filter((m) => (m.round ?? 1) === round).map((match) => (
                <Card key={match.id} className="text-sm">
                  <p className="font-bold">{match.player1?.name ?? 'Por definir'}</p>
                  <p className="text-muted">vs</p>
                  <p className="font-bold">{match.player2?.name ?? 'Por definir'}</p>
                  {match.scoreSummary && <p className="mt-1 text-xs text-accent">{match.scoreSummary}</p>}
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
