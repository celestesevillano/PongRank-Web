import { ChevronLeft, Swords } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { TournamentBanner } from '@/components/tournaments/tournament-banner';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { tournamentsService, type Fixture } from '@/services/tournaments.service';

const GOLD = '#FFD278';

export default function BracketPage() {
  const { id } = useParams();
  const tournamentId = Number(id);
  const { player } = useSession();
  const detail = useFetch((signal) => tournamentsService.fullDetail(tournamentId, signal), [tournamentId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Link to="/matches/tournaments" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <ScreenState {...detail} onRetry={detail.refetch} isEmpty={() => false}>
        {({ tournament, participants, matches }) => {
          const fixtures = matches.filter((m) => m.stage === 'KNOCKOUT');
          const rounds = [...new Set(fixtures.map((m) => m.round))].sort((a, b) => a - b);
          const myMatch = fixtures.find((m) => m.status === 'SCHEDULED' && m.matchId && (m.player1?.id === player?.id || m.player2?.id === player?.id));
          return (
            <>
              <TournamentBanner tournament={tournament}>
                <p className="text-sm text-muted">{participants.length} participantes</p>
                {myMatch?.matchId && <Link to={`/matches/${myMatch.matchId}`} className="mt-1 inline-flex w-fit items-center gap-1 font-bold text-accent"><Swords className="size-4" /> Ver mi partida {myMatch.player1?.id === player?.id ? `vs. ${myMatch.player2?.name}` : `vs. ${myMatch.player1?.name}`}</Link>}
              </TournamentBanner>

              <h2 className="text-lg font-extrabold">Diagrama</h2>
              {fixtures.length === 0 ? <p className="text-sm text-muted">El cuadro todavía no tiene partidos.</p> : (
                <div className="flex items-stretch overflow-x-auto pb-4">
                  {rounds.map((round, index) => {
                    const isFinal = index === rounds.length - 1;
                    const bouts = fixtures.filter((m) => m.round === round).sort((a, b) => a.bracketPosition - b.bracketPosition);
                    return (
                      <div key={round} className="flex min-w-60 flex-col pr-6">
                        <p className="mb-3 text-center text-xs font-bold" style={{ color: GOLD }}>{roundName(rounds, index, fixtures)}</p>
                        <div className="flex flex-1 flex-col justify-around gap-4">
                          {bouts.map((m) => <Bout key={m.id} fixture={m} isFinal={isFinal} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h2 className="text-lg font-extrabold">Participantes</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...participants].sort((a, b) => a.seed - b.seed).map(({ player: p, seed }) => (
                  <Card key={p.id} className="flex justify-between"><span className="font-bold">{seed}. {p.name}</span><span style={{ color: GOLD }}>{Math.round(p.ratingGlicko)}</span></Card>
                ))}
              </div>
            </>
          );
        }}
      </ScreenState>
    </div>
  );
}

function roundName(rounds: number[], index: number, fixtures: Fixture[]) {
  const count = (round: number) => fixtures.filter((m) => m.round === round).length;
  if (index === 0 && rounds.length > 1 && count(rounds[0]) * 2 !== count(rounds[1])) return 'Preliminar';
  const left = rounds.length - index;
  return ({ 1: 'Final', 2: 'Semifinales', 3: 'Cuartos', 4: 'Octavos' } as Record<number, string>)[left] ?? `Ronda ${rounds[index]}`;
}

function Bout({ fixture, isFinal }: { fixture: Fixture; isFinal: boolean }) {
  return (
    <div className={`rounded-xl border bg-[#1A1408] p-3 ${isFinal ? 'border-[#FFD278]' : 'border-[#715426]'}`}>
      <Slot name={fixture.player1?.name} won={!!fixture.winner && fixture.winner.id === fixture.player1?.id} />
      <div className="my-1 h-px bg-[#715426]" />
      <Slot name={fixture.player2?.name} won={!!fixture.winner && fixture.winner.id === fixture.player2?.id} />
    </div>
  );
}

function Slot({ name, won }: { name?: string; won: boolean }) {
  return <p className={`truncate text-sm ${won ? 'font-extrabold text-[#FFD278]' : 'font-bold'}`}>{name ?? 'Por definir'}</p>;
}
