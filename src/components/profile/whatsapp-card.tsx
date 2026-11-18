import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { playersService } from '@/services/players.service';

/** Compartir WhatsApp con los Pongmigos: mismo bloque que en la app móvil. */
export function WhatsappCard() {
  const { player, updateLocalPlayer } = useSession();
  const [share, setShare] = useState(player?.shareContact ?? false);
  const [whatsapp, setWhatsapp] = useState(player?.whatsapp ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async (nextShare: boolean) => {
    if (!player) return;
    setBusy(true);
    try {
      updateLocalPlayer(await playersService.update(player.id, { shareContact: nextShare, whatsapp: whatsapp || undefined }));
      setShare(nextShare);
      setNotice('Preferencia guardada.');
    } catch {
      setNotice('No pudimos guardar el cambio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <MessageCircle aria-hidden className="size-6 text-success" />
        <div className="flex-1">
          <p className="font-bold">Compartir WhatsApp</p>
          <p className="text-sm text-muted">Para coordinar partidas confirmadas</p>
        </div>
        <button type="button" role="switch" aria-checked={share} aria-label="Compartir WhatsApp" disabled={busy} onClick={() => void save(!share)} className={`relative h-7 w-12 rounded-full ${share ? 'bg-primary' : 'bg-line'}`}>
          <span className={`absolute top-0.5 size-6 rounded-full bg-white transition ${share ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Número de WhatsApp" className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
      <Button variant="secondary" loading={busy} onClick={() => void save(share)}>Guardar número</Button>
      {notice && <p className="text-sm text-muted">{notice}</p>}
    </Card>
  );
}
