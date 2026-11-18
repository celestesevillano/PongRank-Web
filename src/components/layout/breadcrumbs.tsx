import { Link, useLocation } from 'react-router-dom';

import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { playersService } from '@/services/players.service';
import { tournamentsService } from '@/services/tournaments.service';

const LABELS: Record<string, string> = {
  social: 'Social',
  community: 'Comunidad',
  club: 'Club',
  player: 'Jugador',
  settings: 'Ajustes',
  admin: 'Administración',
  ranking: 'Ranking',
  communities: 'Social',
  matches: 'Partidas',
  tournaments: 'Torneos',
  new: 'Crear partida',
  find: 'Buscar partida',
  profile: 'Perfil',
  statistics: 'Estadísticas',
  explore: 'Buscar',
  account: 'Cuenta',
  privacy: 'Privacidad',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const name = useEntityName(segments);
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'home')) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b border-line">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-2.5 text-sm text-muted">
        <li>
          <Link to="/home" className="hover:text-white">Inicio</Link>
        </li>
        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const parent = segments[index - 1];
          const label = isLast && name
            ? name
            : LABELS[segment] ?? (parent === 'matches' ? `Partida #${segment}` : segment);
          return (
            <li key={to} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              {isLast ? (
                <span aria-current="page" className="text-white">{label}</span>
              ) : (
                <Link to={to} className="hover:text-white">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function useEntityName(segments: string[]) {
  const parent = segments.at(-2);
  const id = Number(segments.at(-1));
  const valid = Number.isInteger(id) && id > 0;
  const club = useFetch((signal) => valid && parent === 'club' ? clubsService.detail(id, signal) : Promise.resolve(null), [parent, id]);
  const community = useFetch((signal) => valid && parent === 'community' ? communitiesService.detail(id, signal) : Promise.resolve(null), [parent, id]);
  const player = useFetch((signal) => valid && parent === 'player' ? playersService.summary(id, signal) : Promise.resolve(null), [parent, id]);
  const tournament = useFetch((signal) => valid && parent === 'tournaments' ? tournamentsService.detail(id, signal) : Promise.resolve(null), [parent, id]);
  return club.data?.name ?? community.data?.name ?? player.data?.name ?? tournament.data?.name ?? null;
}
