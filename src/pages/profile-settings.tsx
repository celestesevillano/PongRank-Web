import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { playersService } from '@/services/players.service';

export default function ProfileSettingsPage() {
  const { player, updateLocalPlayer } = useSession();
  const [share, setShare] = useState(player?.shareContact ?? false);
  const [whatsapp, setWhatsapp] = useState(player?.whatsapp ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async (nextShare: boolean) => {
    if (!player) return;
    setBusy(true);
    try {
      const updated = await playersService.update(player.id, { shareContact: nextShare, whatsapp: whatsapp || undefined });
      updateLocalPlayer(updated);
      setShare(nextShare);
      setNotice('Preferencia guardada.');
    } catch {
      setNotice('No pudimos guardar el cambio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Ajustes</h1>
      <Card className="flex flex-col gap-3">
        <p className="font-bold">Cuenta</p>
        <p className="text-sm text-muted">{player?.email}</p>
        <Link to="/profile/account" className="text-sm font-bold text-accent">Cuenta</Link>
        <Link to="/profile/privacy" className="text-sm font-bold text-accent">Privacidad</Link>
      </Card>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">WhatsApp</p>
            <p className="text-sm text-muted">Comparte tu número con tus Pongmigos.</p>
          </div>
          <button type="button" role="switch" aria-checked={share} disabled={busy} onClick={() => void save(!share)} className={`relative h-7 w-12 rounded-full ${share ? 'bg-primary' : 'bg-line'}`}>
            <span className={`absolute top-0.5 size-6 rounded-full bg-white transition ${share ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Número de WhatsApp" className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
        <Button loading={busy} onClick={() => void save(share)}>Guardar número</Button>
      </Card>
      <Card>
        <p className="font-bold">Privacidad</p>
        <p className="mt-1 text-sm text-muted">Tus Pongmigos ven tu perfil público. El número de WhatsApp solo se comparte si lo activas.</p>
      </Card>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}
