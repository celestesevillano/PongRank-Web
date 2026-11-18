import { ChevronLeft, Swords, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { playersService } from '@/services/players.service';
import { toApiError } from '@/utils/api-error';

export default function PublicPlayerPage() {
  const { id } = useParams();
  const playerId = Number(id);
  const { player } = useSession();
  const profile = useFetch((signal) => playersService.summary(playerId, signal), [playerId]);
  const history = useFetch((signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: 100 }, signal), [playerId]);
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
        {(data) => {
          const isOther = Boolean(player && player.id !== playerId);
          const relationLabel = relation.data?.friend ? 'Pongmigos' : relation.data?.sent ? 'Solicitud enviada' : relation.data?.received ? 'Te envió una solicitud' : null;
          return (
            <>
              <Card className="overflow-hidden p-0">
                <img src="/illustrations/club-portada.webp" alt="" className="h-48 w-full object-cover sm:h-60" />
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-accent/60 bg-accent/10 text-3xl font-black text-accent">
                      {data.name.slice(0, 1).toUpperCase()}
                      <img src="/brand/pongrank-paddle.webp" alt="" className="absolute -right-1 -bottom-1 h-8" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-3xl font-extrabold">{data.name}</h1>
                      {data.categoryFdptm && <p className="text-sm font-bold text-gold">FDPTM {data.categoryFdptm}</p>}
                    </div>
                  </div>
                  {relationLabel && <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-bold text-accent">{relationLabel}</span>}
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#71333C] bg-[#27151A] py-5">
                <Metric label="Rating PongRank" value={Math.round(data.ratingGlicko)} />
                <Metric label="Partidas" value={history.data?.content.length} />
                <Metric label="Victorias" value={history.data ? history.data.content.filter((m) => m.winnerId === playerId).length : undefined} />
              </div>

              {isOther && (
                <div className="flex flex-wrap gap-3">
                  {relation.data?.friend ? null
                    : relation.data?.sent ? <Button className="flex-1" loading={busy} icon={X} onClick={() => act(() => friendshipsService.cancel(relation.data!.sent!.id), 'Solicitud cancelada.')}>Cancelar solicitud</Button>
                    : relation.data?.received ? <Button className="flex-1" loading={busy} onClick={() => act(() => friendshipsService.accept(relation.data!.received!.id), 'Ya son Pongmigos.')}>Aceptar solicitud</Button>
                    : <Button className="flex-1" icon={UserPlus} loading={busy} onClick={() => act(() => friendshipsService.send(playerId), 'Solicitud enviada.')}>Agregar Pongmigo</Button>}
                  <Link to="/matches/new" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-muted px-4 font-bold hover:bg-white/5"><Swords className="size-4" /> Retar</Link>
                </div>
              )}
            </>
          );
        }}
      </ScreenState>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <span className="text-3xl font-extrabold text-[#FFC3C8] tabular-nums">{value ?? '—'}</span>
      <span className="text-center text-sm text-[#FFC3C8]">{label}</span>
    </div>
  );
}
