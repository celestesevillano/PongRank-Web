import { Link, useLocation } from 'react-router-dom';

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
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b border-line">
      <ol className="mx-auto flex max-w-5xl flex-wrap items-center gap-1.5 px-4 py-2.5 text-sm text-muted">
        <li>
          <Link to="/" className="hover:text-white">Inicio</Link>
        </li>
        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = LABELS[segment] ?? (segments[index - 1] === 'matches' ? `Partida #${segment}` : segment);
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
