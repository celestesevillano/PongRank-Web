import { Search, Users } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { playersService } from '@/services/players.service';
import type { Club, ClubMembership, CommunityResponse, Friendship, PlayerSummary } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type Segment = 'communities' | 'clubs' | 'pongmigos';

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'communities', label: 'Comunidades' },
  { value: 'clubs', label: 'Clubes' },
  { value: 'pongmigos', label: 'Pongmigos' },
];

export default function SocialPage() {
  const [segment, setSegment] = useState<Segment>('communities');
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">Social</h1>

      <label className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en Social"
          className="min-h-11 w-full rounded-xl border border-line bg-black py-2.5 pr-3 pl-10 outline-none focus:border-accent"
        />
      </label>

      <div role="tablist" className="flex w-full rounded-xl bg-surface p-1">
        {SEGMENTS.map((item) => {
          const selected = item.value === segment;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setSegment(item.value)}
              className={`min-h-11 flex-1 rounded-lg text-sm font-bold ${selected ? 'bg-black text-white' : 'text-muted hover:text-white'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {segment === 'communities' && <CommunitiesSegment query={query} />}
      {segment === 'clubs' && <ClubsSegment query={query} />}
      {segment === 'pongmigos' && <PongmigosSegment query={query} />}
    </div>
  );
}

function CommunitiesSegment({ query }: { query: string }) {
  const { player } = useSession();
  const mine = useFetch((signal) => communitiesService.mine(signal), []);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<CommunityResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = mine.data ?? [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [mine.data, query]);

  const run = async (community: CommunityResponse, action: () => Promise<unknown>) => {
    setPendingId(community.id);
    try {
      await action();
      mine.refetch();
    } catch (err) {
      const api = toApiError(err);
      setNotice(api.status === 409
        ? 'Esa comunidad está en pausa y no admite nuevos miembros por ahora. Elige otra.'
        : api.message);
    } finally {
      setPendingId(null);
      setLeaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Tus comunidades</h2>
      <ScreenState {...mine} onRetry={mine.refetch} isEmpty={() => filtered.length === 0} emptyMessage="Aún no perteneces a una comunidad.">
        {() => (
          <div className="flex flex-col gap-3">
            {filtered.map((community) => (
              <Card key={community.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{community.name}</p>
                  <p className="text-xs text-muted">{community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'}</p>
                </div>
                <Button variant="secondary" disabled={pendingId === community.id} onClick={() => setLeaving(community)}>
                  Salir
                </Button>
              </Card>
            ))}
          </div>
        )}
      </ScreenState>
      <ConfirmDialog
        open={leaving !== null}
        title="¿Salir de la comunidad?"
        message={`Dejarás de aparecer en el ranking de ${leaving?.name ?? 'esta comunidad'}.`}
        confirmLabel="Salir"
        loading={leaving !== null && pendingId === leaving.id}
        onCancel={() => setLeaving(null)}
        onConfirm={() => leaving && player && run(leaving, () => communitiesService.leave(leaving.id, player.id))}
      />
      {notice && <InfoPopup message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function ClubsSegment({ query }: { query: string }) {
  const { player } = useSession();
  const managed = useFetch((signal) => clubsService.managed(signal), []);
  const memberships = useFetch((signal) => player ? clubsService.memberships(player.id, signal) : Promise.resolve([] as ClubMembership[]), [player?.id]);
  const search = useFetch((signal) => clubsService.search({ page: 0, size: 20, name: query.trim() || undefined }, signal), [query]);

  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const memberClubIds = new Set((memberships.data ?? []).filter((m) => m.status === 'APPROVED' || m.status === 'PENDING').map((m) => m.clubId));

  const request = async (club: Club) => {
    setPending(club.id);
    try {
      await clubsService.requestMembership(club.id);
      setNotice('Solicitud enviada. El club la revisará.');
      memberships.refetch();
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tus clubes</h2>
        <ScreenState {...managed} onRetry={managed.refetch} isEmpty={(data) => data.length === 0} emptyMessage="Todavía no administras un club.">
          {(list) => (
            <div className="flex flex-col gap-3">
              {list.map((club) => (
                <Card key={club.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{club.name}</p>
                    <p className="text-xs text-muted">{club.status === 'PENDING' ? 'En revisión' : club.status === 'APPROVED' ? 'Aprobado' : club.status}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScreenState>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Clubes aprobados</h2>
        <ScreenState {...search} onRetry={search.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage={query ? 'No encontramos clubes con ese nombre.' : 'Todavía no hay clubes aprobados.'}>
          {(page) => (
            <div className="flex flex-col gap-3">
              {page.content.map((club) => (
                <Card key={club.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{club.name}</p>
                    <p className="truncate text-xs text-muted">{club.address}</p>
                  </div>
                  {memberClubIds.has(club.id) ? (
                    <span className="text-sm font-bold text-accent">Miembro</span>
                  ) : (
                    <Button loading={pending === club.id} onClick={() => request(club)}>Unirme</Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScreenState>
      </section>
      {notice && <InfoPopup message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function PongmigosSegment({ query }: { query: string }) {
  const { player } = useSession();
  const accepted = useFetch((signal) => player ? friendshipsService.accepted(player.id, signal) : Promise.resolve([] as Friendship[]), [player?.id]);
  const received = useFetch((signal) => player ? friendshipsService.received(player.id, signal) : Promise.resolve([] as Friendship[]), [player?.id]);
  const sent = useFetch((signal) => player ? friendshipsService.sent(player.id, signal) : Promise.resolve([] as Friendship[]), [player?.id]);
  const results = useFetch((signal) => query.trim().length >= 2 ? playersService.search(query.trim(), { page: 0, size: 10 }, signal) : Promise.resolve(null), [query]);

  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () => {
    accepted.refetch();
    received.refetch();
    sent.refetch();
  };

  const act = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusy(id);
    try {
      await action();
      setNotice(message);
      refresh();
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setBusy(null);
    }
  };

  if (!player) return null;

  const friends = (accepted.data ?? []).filter((f) => friendOf(f, player.id).name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      {query.trim().length >= 2 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Jugadores</h2>
          <ScreenState {...results} onRetry={results.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage="No encontramos jugadores con ese nombre.">
            {(page) => page && (
              <div className="flex flex-col gap-3">
                {page.content.filter((p) => p.id !== player.id).map((p) => (
                  <PlayerRow key={p.id} player={p} action={
                    <Button loading={busy === p.id} onClick={() => act(p.id, () => friendshipsService.send(p.id), 'Solicitud enviada.')}>
                      Agregar
                    </Button>
                  } />
                ))}
              </div>
            )}
          </ScreenState>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Solicitudes recibidas</h2>
        {(received.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">No tienes solicitudes pendientes.</p>
        ) : (
          (received.data ?? []).map((f) => {
            const other = friendOf(f, player.id);
            return (
              <PlayerRow key={f.id} player={other} action={
                <div className="flex gap-2">
                  <Button loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.accept(f.id), 'Ya son Pongmigos.')}>Aceptar</Button>
                  <Button variant="secondary" disabled={busy === f.id} onClick={() => act(f.id, () => friendshipsService.reject(f.id), 'Solicitud rechazada.')}>Rechazar</Button>
                </div>
              } />
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Solicitudes enviadas</h2>
        {(sent.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">No has enviado solicitudes.</p>
        ) : (
          (sent.data ?? []).map((f) => {
            const other = friendOf(f, player.id);
            return (
              <PlayerRow key={f.id} player={other} action={
                <Button variant="secondary" loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.cancel(f.id), 'Solicitud cancelada.')}>Cancelar</Button>
              } />
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tus Pongmigos</h2>
        <ScreenState {...accepted} onRetry={accepted.refetch} isEmpty={() => friends.length === 0} emptyMessage="Todavía no tienes Pongmigos.">
          {() => (
            <div className="flex flex-col gap-3">
              {friends.map((f) => {
                const other = friendOf(f, player.id);
                return (
                  <PlayerRow key={f.id} player={other} action={
                    <Button variant="secondary" loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.remove(f.id), 'Pongmigo eliminado.')}>Eliminar</Button>
                  } />
                );
              })}
            </div>
          )}
        </ScreenState>
      </section>
      {notice && <InfoPopup message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function PlayerRow({ player, action }: { player: PlayerSummary; action: ReactNode }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
          <Users aria-hidden className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{player.name}</p>
          <p className="text-xs text-muted">{Math.round(player.ratingGlicko)} pts</p>
        </div>
      </div>
      {action}
    </Card>
  );
}

function InfoPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Users className="size-5" />
        </div>
        <p className="text-sm text-muted">{message}</p>
        <Button onClick={onClose}>Aceptar</Button>
      </div>
    </div>
  );
}
