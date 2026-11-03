import { NavLink } from 'react-router-dom';

import { useSession } from '@/context/session';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/ranking', label: 'Ranking' },
  { to: '/matches', label: 'Partidas' },
  { to: '/profile', label: 'Perfil' },
];

export function Navbar() {
  const { player, signOut } = useSession();

  return (
    <header className="border-b border-line bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-xl font-extrabold">
          Pong<span className="text-brand">Rank</span>
        </span>
        <nav className="flex gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-bold ${isActive ? 'bg-brand text-white' : 'text-muted hover:text-white'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{player?.name}</span>
          <button onClick={() => void signOut()} className="font-bold text-brand hover:underline">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
