import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { useState, type FormEvent } from 'react';

export default function AccountPage() {
  const { player } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (next.length < 8) { setNotice('La nueva contraseña necesita al menos 8 caracteres.'); return; }
    setBusy(true);
    try {
      await authService.changePassword({ currentPassword: current, newPassword: next });
      setNotice('Contraseña actualizada.');
      setCurrent('');
      setNext('');
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Link to="/profile/settings" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Cuenta</h1>
      <Card>
        <p className="font-bold">{player?.name}</p>
        <p className="text-sm text-muted">{player?.email}</p>
      </Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Contraseña actual" className="min-h-11 rounded-xl border border-line bg-black px-3" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Nueva contraseña" className="min-h-11 rounded-xl border border-line bg-black px-3" />
        <Button type="submit" loading={busy}>Cambiar contraseña</Button>
      </form>
      {notice && <p className="text-sm text-muted">{notice}</p>}
    </div>
  );
}
