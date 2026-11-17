import { CircleUser, House, LogOut, Swords, Trophy, Users, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useSession } from '@/context/session';
import { BrandImages } from '@/lib/brand';
import { paths } from '@/routes/paths';

const LINKS: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] = [
  { to: paths.home, label: 'Inicio', Icon: House, end: true },
  { to: paths.communities, label: 'Comunidades', Icon: Users },
  { to: paths.matches, label: 'Partidas', Icon: Swords },
  { to: paths.ranking, label: 'Ranking', Icon: Trophy },
  { to: paths.profile, label: 'Perfil', Icon: CircleUser },
];

export function Navbar() {
  const { player, signOut } = useSession();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <img src={BrandImages.wordmark} alt="PongRank" width={116} height={14} className="h-5 w-29 object-contain object-left" />
          <nav aria-label="Principal" className="hidden gap-1 sm:flex">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className="relative rounded-lg px-3 py-1.5 text-sm font-bold">
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden className="nav-pill absolute inset-0 rounded-lg bg-brand" />}
                    <span className={`relative flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-muted hover:text-white'}`}>
                      <link.Icon aria-hidden className="size-4" />
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-36 truncate text-muted md:inline">{player?.name}</span>
            <button type="button" onClick={() => void signOut()} className="flex items-center gap-1.5 font-bold text-brand hover:underline">
              <LogOut aria-hidden className="size-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-black pb-[env(safe-area-inset-bottom)] sm:hidden">
        <ul className="grid grid-cols-5">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} className="flex min-h-15 flex-col items-center justify-center gap-1 text-[11px] font-semibold">
                {({ isActive }) => (
                  <>
                    <span className="relative flex size-8 items-center justify-center">
                      {isActive && <span aria-hidden className="nav-pill absolute size-7.5 rounded-full bg-brand" />}
                      <link.Icon aria-hidden className={`relative ${isActive ? 'size-[19px] text-white' : 'size-[23px] text-muted'}`} />
                    </span>
                    <span className={isActive ? 'text-brand' : 'text-muted'}>{link.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
