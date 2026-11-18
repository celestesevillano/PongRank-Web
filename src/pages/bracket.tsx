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
          const finalRound = rounds[rounds.length - 1];
          const root = fixtures.filter((m) => m.round === finalRound).sort((a, b) => a.bracketPosition - b.bracketPosition)[0];
          const myMatch = fixtures.find((m) => m.status === 'SCHEDULED' && m.matchId && (m.player1?.id === player?.id || m.player2?.id === player?.id));
          return (
            <>
              <TournamentBanner tournament={tournament}>
                <p className="text-sm text-muted">{participants.length} participantes</p>
                {myMatch?.matchId && <Link to={`/matches/${myMatch.matchId}`} className="mt-1 inline-flex w-fit items-center gap-1 font-bold text-accent"><Swords className="size-4" /> Ver mi partida {myMatch.player1?.id === player?.id ? `vs. ${myMatch.player2?.name}` : `vs. ${myMatch.player1?.name}`}</Link>}
              </TournamentBanner>

              <h2 className="text-lg font-extrabold">Diagrama</h2>
              {fixtures.length === 0 || !root ? <p className="text-sm text-muted">El cuadro todavía no tiene partidos.</p> : (
                <div className="overflow-x-auto pb-4">
                  <div className="flex w-max min-w-full flex-col items-end">
                    <div className="mb-2 flex">
                      {rounds.map((round, index) => (
                        <p key={round} className={`${index === rounds.length - 1 ? 'w-60' : 'w-66'} text-center text-xs font-bold`} style={{ color: GOLD }}>{roundName(rounds, index, fixtures)}</p>
                      ))}
                    </div>
                    <Tree node={root} fixtures={fixtures} isFinal />
                  </div>
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
  if (index === 0 && rounds.length > 1 && count(rounds[0]) !== count(rounds[1]) * 2) return 'Preliminar';
  const left = rounds.length - index;
  return ({ 1: 'Final', 2: 'Semifinales', 3: 'Cuartos', 4: 'Octavos' } as Record<number, string>)[left] ?? `Ronda ${rounds[index]}`;
}

function Tree({ node, fixtures, isFinal = false }: { node: Fixture; fixtures: Fixture[]; isFinal?: boolean }) {
  const children = fixtures
    .filter((m) => m.round === node.round - 1 && Math.floor(m.bracketPosition / 2) === node.bracketPosition)
    .sort((a, b) => a.bracketPosition - b.bracketPosition);
  return (
    <div className="flex items-center">
      {children.length > 0 && (
        <div className="flex flex-col">
          {children.map((child, index) => (
            <div key={child.id} className="relative py-2 pr-6">
              <Tree node={child} fixtures={fixtures} />
              <span className="absolute top-1/2 right-0 h-px w-6 bg-[#715426]" />
              {children.length > 1 && <span className={`absolute right-0 w-px bg-[#715426] ${index === 0 ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2'}`} />}
            </div>
          ))}
        </div>
      )}
      <Bout fixture={node} isFinal={isFinal} />
    </div>
  );
}

function Bout({ fixture, isFinal }: { fixture: Fixture; isFinal: boolean }) {
  return (
    <div className={`w-60 shrink-0 rounded-xl border bg-[#1A1408] p-3 ${isFinal ? 'border-[#FFD278]' : 'border-[#715426]'}`}>
      <Slot name={fixture.player1?.name} won={!!fixture.winner && fixture.winner.id === fixture.player1?.id} />
      <div className="my-1 h-px bg-[#715426]" />
      <Slot name={fixture.player2?.name} won={!!fixture.winner && fixture.winner.id === fixture.player2?.id} />
    </div>
  );
}

function Slot({ name, won }: { name?: string; won: boolean }) {
  return <p className={`truncate text-sm ${won ? 'font-extrabold text-[#FFD278]' : 'font-bold'}`}>{name ?? 'Por definir'}</p>;
}
