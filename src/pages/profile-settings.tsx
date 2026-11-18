import { ChevronLeft, ChevronRight, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS: { to: string; title: string; text: string; Icon: LucideIcon }[] = [
  { to: '/profile/account', title: 'Cuenta', text: 'Perfil y plan', Icon: User },
  { to: '/profile/privacy', title: 'Privacidad', text: 'Quién puede ver tu información', Icon: ShieldCheck },
];

export default function ProfileSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-3xl font-extrabold md:text-4xl">Configuración</h1>
      <div className="flex flex-col gap-3">
        {ITEMS.map(({ to, title, text, Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-accent">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10"><Icon aria-hidden className="size-5 text-accent" /></span>
            <span className="flex-1">
              <span className="block font-extrabold">{title}</span>
              <span className="block text-sm text-muted">{text}</span>
            </span>
            <ChevronRight aria-hidden className="size-4 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
