import { ChevronLeft, Swords, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { playersService } from '@/services/players.service';
import { toApiError } from '@/utils/api-error';

export default function PublicPlayerPage() {
  const { id } = useParams();
  const playerId = Number(id);
  const { player } = useSession();
  const profile = useFetch((signal) => playersService.summary(playerId, signal), [playerId]);
  const relation = useFetch(async (signal) => {
    if (!player || player.id === playerId) return null;
    const [friends, received, sent] = await Promise.all([
      friendshipsService.accepted(player.id, signal),
      friendshipsService.received(player.id, signal),
      friendshipsService.sent(player.id, signal),
    ]);
    return {
      friend: friends.find((item) => friendOf(item, player.id).id === playerId),
      received: received.find((item) => item.playerA.id === playerId),
      sent: sent.find((item) => item.playerB.id === playerId),
    };
  }, [player?.id, playerId]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const act = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try { await action(); setNotice(message); relation.refetch(); }
    catch (err) { setNotice(toApiError(err).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <ScreenState {...profile} onRetry={profile.refetch} isEmpty={() => false}>
        {(data) => (
          <>
            <Card className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-surface text-2xl font-extrabold text-accent">{data.name.slice(0, 1)}</div>
              <div>
                <h1 className="text-2xl font-extrabold">{data.name}</h1>
                <p className="text-sm text-muted">{Math.round(data.ratingGlicko)} pts</p>
                {data.categoryFdptm && <p className="text-xs font-bold text-gold">FDPTM {data.categoryFdptm}</p>}
              </div>
            </Card>
            {player && player.id !== playerId && (
              <div className="flex flex-wrap gap-2">
                {relation.data?.friend ? <span className="text-sm font-bold text-accent">Ya son Pongmigos</span>
                  : relation.data?.sent ? <Button variant="secondary" loading={busy} onClick={() => act(() => friendshipsService.cancel(relation.data!.sent!.id), 'Solicitud cancelada.')}>Cancelar solicitud</Button>
                  : relation.data?.received ? <Button loading={busy} onClick={() => act(() => friendshipsService.accept(relation.data!.received!.id), 'Ya son Pongmigos.')}>Aceptar</Button>
                  : <Button icon={UserPlus} loading={busy} onClick={() => act(() => friendshipsService.send(playerId), 'Solicitud enviada.')}>Agregar</Button>}
                <Link to="/matches/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 font-bold"><Swords className="size-4" /> Retar</Link>
              </div>
            )}
          </>
        )}
      </ScreenState>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}
