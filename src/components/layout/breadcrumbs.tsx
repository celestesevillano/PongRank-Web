import { Link, useLocation } from 'react-router-dom';

const LABELS: Record<string, string> = {
  ranking: 'Ranking',
  matches: 'Partidas',
  profile: 'Perfil',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-white">
            Inicio
          </Link>
        </li>
        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = LABELS[segment] ?? `#${segment}`;
          return (
            <li key={to} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              {isLast ? (
                <span aria-current="page" className="text-white">
                  {label}
                </span>
              ) : (
                <Link to={to} className="hover:text-white">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
