import { ChevronRight, Layers, Pencil, Settings, Trophy } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';
import { playersService } from '@/services/players.service';
import { toApiError } from '@/utils/api-error';
import { validateName } from '@/utils/validation';

export default function ProfilePage() {
  const { player, updateLocalPlayer } = useSession();
  const { plan } = usePlan();
  const [editing, setEditing] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [name, setName] = useState(player!.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const history = useFetch(
    (signal) => matchesService.byPlayer(player!.id, { status: 'CONFIRMED', page: 0, size: 100 }, signal),
    [player!.id],
  );
  const wins = (history.data?.content ?? []).filter((m) => m.winnerId === player!.id).length;
  const played = history.data?.content.length;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateName(name);
    setError(validation);
    if (validation) return;
    setSaving(true);
    try {
      updateLocalPlayer(await playersService.update(player!.id, { name: name.trim() }));
      setNotice('Perfil actualizado.');
      setEditing(false);
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (showPlan) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <button type="button" onClick={() => setShowPlan(false)} className="self-start text-sm font-bold text-muted hover:text-white">← Volver</button>
        <h1 className="text-3xl font-extrabold">Mi plan</h1>
        <div className="relative overflow-hidden rounded-2xl border border-[#9D742F] bg-[#1A1408] p-6">
          <img src="/illustrations/pongrank-plan-pro.webp" alt="" className="pointer-events-none absolute right-0 bottom-0 h-full w-1/3 object-contain opacity-80" />
          <p className="text-xs font-bold text-gold">PLAN ACTUAL</p>
          <p className="text-2xl font-extrabold">{plan?.plan === 'ENTERPRISE' ? 'Enterprise' : plan?.plan === 'PRO' ? 'Pro' : 'Gratis'}</p>
          <p className="mt-1 text-sm text-muted">Los planes se gestionan desde la app móvil.</p>
        </div>
        <Card>
          <p className="font-bold">Tus espacios</p>
          <p className="mt-1 text-sm text-muted">Cada comunidad o club usa 1 espacio. El detalle del plan se ve en la app.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold md:text-4xl">Perfil</h1>
        <Link to="/profile/settings" aria-label="Configuración" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface">
          <Settings className="size-6" />
        </Link>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-r from-[#0B2229] to-[#12323A] p-5">
          <img src="/brand/pongrank-paddle.webp" alt="" className="absolute top-4 right-6 h-10" />
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-accent text-xl font-black text-accent">{player!.name.slice(0, 2).toUpperCase()}</div>
          <p className="mt-3 text-2xl font-extrabold">{player!.name}</p>
          <p className="text-sm text-muted">@{player!.username ?? player!.email.split('@')[0]}</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#71333C] bg-[#27151A] py-4">
        <Metric label="Rating PongRank" value={Math.round(player!.ratingGlicko)} />
        <Metric label="Partidas" value={played} />
        <Metric label="Victorias" value={wins} />
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setEditing(true)} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left">
          <Pencil className="size-5 text-accent" />
          <span className="flex-1 font-bold">Editar perfil</span>
          <ChevronRight className="size-4 text-muted" />
        </button>
        <button type="button" onClick={() => setShowPlan(true)} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left">
          <Layers className="size-5 text-accent" />
          <span className="flex-1 font-bold">Mi plan</span>
          <span className="text-sm font-bold text-accent">{plan?.plan === 'ENTERPRISE' ? 'Enterprise' : plan?.plan === 'PRO' ? 'Pro' : 'Gratis'}</span>
          <ChevronRight className="size-4 text-muted" />
        </button>
      </div>

      {editing && (
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={error} />
            <TextField label="Correo" value={player!.email} disabled readOnly />
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center">
            <Trophy className="size-8 text-accent" />
            <p className="text-sm text-muted">{notice}</p>
            <Button onClick={() => setNotice(null)}>Aceptar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <span className="text-2xl font-extrabold text-[#FFC3C8] tabular-nums">{value ?? '—'}</span>
      <span className="text-center text-xs text-[#FFC3C8]">{label}</span>
    </div>
  );
}
