import { ChevronLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';

export default function TournamentsPage() {
  const { player } = useSession();
  const tournaments = useFetch((signal) => player ? matchesService.forTournaments(player.id, signal) : Promise.resolve([]), [player?.id]);
  const list = tournaments.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Torneos</h1>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <img src="/illustrations/partidas-tournament.webp" alt="" className="w-40" />
          <p className="text-sm text-muted">Todavía no participas en un torneo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((match) => (
            <Card key={match.id} className="flex items-center justify-between">
              <div>
                <p className="font-bold">{match.tournamentName ?? 'Torneo'}</p>
                <p className="text-xs text-muted">{match.status}</p>
              </div>
              <Link to={`/matches/${match.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-accent"><Trophy className="size-4" /> Ver</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
