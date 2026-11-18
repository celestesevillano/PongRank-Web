import { CalendarClock, Swords, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Tournament } from '@/services/tournaments.service';
import { FORMAT_LABELS } from '@/utils/match-status';

const GOLD = '#FFD278';

export function tournamentStatusLabel(tournament: Pick<Tournament, 'status' | 'directElimination'>) {
  if (tournament.status === 'FINISHED') return 'Finalizado';
  if (tournament.directElimination || tournament.status === 'KNOCKOUT_STAGE') return 'Llave publicada';
  if (tournament.status === 'GROUP_STAGE') return 'En curso';
  return 'Borrador';
}

export function formatTournamentDate(startDate?: string | null) {
  if (!startDate) return null;
  return new Date(`${startDate}-05:00`).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' });
}

export function TournamentBanner({ tournament, children }: { tournament: Tournament; children?: ReactNode }) {
  const date = formatTournamentDate(tournament.startDate);
  return (
    <div className="relative flex min-h-40 flex-col justify-center gap-1 overflow-hidden rounded-2xl border border-[#71313B] p-5">
      <img src="/illustrations/torneo-copa-banner.webp" alt="" className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto max-w-none select-none" style={{ maskImage: 'linear-gradient(to right, transparent 0%, #000 30%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 30%)' }} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      <div className="relative flex flex-col gap-1">
        <p className="inline-flex items-center gap-1 text-sm font-bold text-primary"><Trophy className="size-4" /> {tournamentStatusLabel(tournament)}</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{tournament.name}</h1>
        {date && <p className="inline-flex items-center gap-1 text-sm text-muted"><CalendarClock className="size-4 text-accent" /> {date}</p>}
        <p className="inline-flex items-center gap-1 text-sm text-muted"><Swords className="size-4 text-accent" /> {FORMAT_LABELS[tournament.matchFormat]}</p>
        {tournament.winner && <p className="mt-1 inline-flex items-center gap-1 font-bold" style={{ color: GOLD }}><Trophy className="size-4" /> Campeón: {tournament.winner.name}</p>}
        {children}
      </div>
    </div>
  );
}
