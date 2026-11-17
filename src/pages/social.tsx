import { ChevronRight, Plus, Search, Send, UserPlus, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService, type CommunityCreateInput } from '@/services/communities.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { playersService } from '@/services/players.service';
import type { Club, ClubMembership, CommunityResponse, Friendship, PlayerSummary } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { CREATABLE_COMMUNITY_TYPES, COMMUNITY_TYPE_LABELS, type CommunityType } from '@/utils/community-types';

type Segment = 'communities' | 'clubs' | 'pongmigos';

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'communities', label: 'Comunidades' },
  { value: 'clubs', label: 'Clubes' },
  { value: 'pongmigos', label: 'Pongmigos' },
];

const BANNERS = {
  communities: { title: 'Mis comunidades', art: '/illustrations/pongrank-comunidades-banner.webp', bg: '#0B2229', border: '#28616C', accent: '#22D3EE' },
  clubs: { title: 'Mis clubes', art: '/illustrations/pongrank-clubes-social-equipo.webp', bg: '#000', border: '#715426', accent: '#FFD278' },
  pongmigos: { title: 'Mis Pongmigos', art: '/illustrations/pongrank-pongmigos-social-rojo.webp', bg: '#000', border: '#71333C', accent: '#E8262F' },
} as const;

export default function SocialPage() {
  const [segment, setSegment] = useState<Segment>('communities');
  const [query] = useState('');

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold md:text-4xl">Social</h1>

      <Link to="/social/explore" className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <span className="flex min-h-11 w-full items-center rounded-xl border border-line bg-black py-2.5 pr-3 pl-10 text-muted">Buscar en Social</span>
      </Link>

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

function Banner({ kind, subtitle }: { kind: keyof typeof BANNERS; subtitle?: string }) {
  const banner = BANNERS[kind];
  return (
    <div className="relative flex h-36 items-center overflow-hidden rounded-2xl border md:h-40" style={{ background: banner.bg, borderColor: banner.border }}>
      <img src={banner.art} alt="" className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto max-w-[55%] object-contain object-right" />
      <div className="relative z-10 flex h-full max-w-[50%] flex-col justify-center gap-1 p-5">
        <h2 className="text-lg font-extrabold md:text-xl">{banner.title}</h2>
        {subtitle && <p className="text-sm font-semibold" style={{ color: banner.accent }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function CommunitiesSegment({ query }: { query: string }) {
  const { player } = useSession();
  const mine = useFetch((signal) => communitiesService.mine(signal), []);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<CommunityResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = mine.data ?? [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [mine.data, query]);
  const active = filtered.filter((c) => !c.status || c.status === 'ACTIVE');
  const archived = (mine.data ?? []).filter((c) => c.status === 'DELETED' || c.status === 'ARCHIVED');

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
    <div className="flex flex-col gap-4">
      <Banner kind="communities" subtitle={`${filtered.length} ${filtered.length === 1 ? 'comunidad' : 'comunidades'}`} />
      <h3 className="text-lg font-bold">Tu lista</h3>
      <ScreenState {...mine} onRetry={mine.refetch} isEmpty={() => filtered.length === 0} emptyMessage="Aún no perteneces a una comunidad. Encuentra una desde Buscar en Social.">
        {() => (
          <div className="flex flex-col gap-3">
            {filtered.map((community) => (
              <Card key={community.id} className="flex items-center justify-between gap-3">
                <Link to={`/social/community/${community.id}`} className="min-w-0">
                  <p className="truncate font-bold">{community.name}</p>
                  <p className="text-xs text-muted">{community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'}</p>
                </Link>
                <Button variant="secondary" disabled={pendingId === community.id} onClick={() => setLeaving(community)}>Salir</Button>
              </Card>
            ))}
          </div>
        )}
      </ScreenState>
      <Button icon={Plus} onClick={() => setCreating(true)}>Crear comunidad</Button>
      <button type="button" onClick={() => setShowHistory((v) => !v)} className="self-start text-sm font-bold text-muted">Historial de comunidades</button>
      {showHistory && (
        archived.length === 0
          ? <p className="text-sm text-muted">No tienes comunidades archivadas.</p>
          : archived.map((community) => (
            <Card key={community.id}>
              <p className="font-bold">{community.name}</p>
              <p className="text-xs text-muted">{community.status === 'DELETED' ? 'Eliminada' : 'Archivada'}</p>
            </Card>
          ))
      )}
      {creating && <CreateCommunity onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setNotice('Comunidad creada.'); mine.refetch(); }} />}
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
  const navigate = useNavigate();
  const { player } = useSession();
  const managed = useFetch((signal) => clubsService.managed(signal), []);
  const memberships = useFetch((signal) => player ? clubsService.memberships(player.id, signal) : Promise.resolve([] as ClubMembership[]), [player?.id]);
  const search = useFetch((signal) => clubsService.search({ page: 0, size: 20, name: query.trim() || undefined }, signal), [query]);
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);

  const memberClubIds = new Set((memberships.data ?? []).filter((m) => m.status === 'APPROVED' || m.status === 'PENDING').map((m) => m.clubId));
  const pendingRequests = (memberships.data ?? []).filter((m) => m.status === 'PENDING');

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
    <div className="flex flex-col gap-4">
      <Banner kind="clubs" />
      <button type="button" onClick={() => setShowRequests((v) => !v)} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left">
        <Send className="size-5 text-accent" />
        <span className="flex-1 font-bold">Solicitudes enviadas</span>
        {pendingRequests.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{pendingRequests.length}</span>}
        <ChevronRight className="size-4 text-muted" />
      </button>
      {showRequests && (
        <div className="flex flex-col gap-2">
          {pendingRequests.length === 0 ? <p className="text-sm text-muted">No tienes solicitudes pendientes.</p> : pendingRequests.map((m) => (
            <Card key={m.id}><p className="font-bold">{m.clubName}</p><p className="text-xs text-muted">En revisión</p></Card>
          ))}
        </div>
      )}
      <h3 className="text-lg font-bold">Tu lista</h3>
      <ScreenState {...managed} onRetry={managed.refetch} isEmpty={(data) => data.length === 0} emptyMessage="Todavía no administras un club.">
        {(list) => (
          <div className="flex flex-col gap-3">
            {list.map((club) => (
              <Card key={club.id}>
                <Link to={`/social/club/${club.id}`}>
                  <p className="truncate font-bold">{club.name}</p>
                  <p className="text-xs text-muted">{club.status === 'PENDING' ? 'Registro en revisión' : club.status === 'APPROVED' ? 'Aprobado' : club.status ?? 'Club'}</p>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </ScreenState>
      <h3 className="text-lg font-bold">Clubes aprobados</h3>
      <ScreenState {...search} onRetry={search.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage={query ? 'No encontramos clubes con ese nombre.' : 'Todavía no hay clubes aprobados.'}>
        {(page) => (
          <div className="flex flex-col gap-3">
            {page.content.map((club) => (
              <Card key={club.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{club.name}</p>
                  <p className="truncate text-xs text-muted">{club.address}</p>
                </div>
                {memberClubIds.has(club.id) ? <span className="text-sm font-bold text-accent">Miembro</span> : <Button loading={pending === club.id} onClick={() => request(club)}>Unirme</Button>}
              </Card>
            ))}
          </div>
        )}
      </ScreenState>
      <Button icon={Plus} variant="secondary" onClick={() => navigate('/social/register-club')}>Registrar club</Button>
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
  const [box, setBox] = useState<'none' | 'received' | 'sent'>('none');

  const refresh = () => { accepted.refetch(); received.refetch(); sent.refetch(); };
  const act = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusy(id);
    try { await action(); setNotice(message); refresh(); }
    catch (err) { setNotice(toApiError(err).message); }
    finally { setBusy(null); }
  };

  if (!player) return null;
  const friends = (accepted.data ?? []).filter((f) => friendOf(f, player.id).name.toLowerCase().includes(query.trim().toLowerCase()));
  const receivedCount = received.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Banner kind="pongmigos" subtitle={`${friends.length} ${friends.length === 1 ? 'Pongmigo' : 'Pongmigos'}`} />
      <button type="button" onClick={() => setBox(box === 'received' ? 'none' : 'received')} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left">
        <UserPlus className="size-5 text-accent" />
        <span className="flex-1 font-bold">Solicitudes recibidas</span>
        {receivedCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{receivedCount}</span>}
        <ChevronRight className="size-4 text-muted" />
      </button>
      <button type="button" onClick={() => setBox(box === 'sent' ? 'none' : 'sent')} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left">
        <Send className="size-5 text-accent" />
        <span className="flex-1 font-bold">Solicitudes enviadas</span>
        <ChevronRight className="size-4 text-muted" />
      </button>

      {box === 'received' && (
        <div className="flex flex-col gap-2">
          {(received.data ?? []).length === 0 ? <p className="text-sm text-muted">No tienes solicitudes pendientes.</p> : (received.data ?? []).map((f) => {
            const other = friendOf(f, player.id);
            return <PlayerRow key={f.id} player={other} action={<div className="flex gap-2"><Button loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.accept(f.id), 'Ya son Pongmigos.')}>Aceptar</Button><Button variant="secondary" disabled={busy === f.id} onClick={() => act(f.id, () => friendshipsService.reject(f.id), 'Solicitud rechazada.')}>Rechazar</Button></div>} />;
          })}
        </div>
      )}
      {box === 'sent' && (
        <div className="flex flex-col gap-2">
          {(sent.data ?? []).length === 0 ? <p className="text-sm text-muted">No has enviado solicitudes.</p> : (sent.data ?? []).map((f) => {
            const other = friendOf(f, player.id);
            return <PlayerRow key={f.id} player={other} action={<Button variant="secondary" loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.cancel(f.id), 'Solicitud cancelada.')}>Cancelar</Button>} />;
          })}
        </div>
      )}

      {query.trim().length >= 2 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-bold">Jugadores</h3>
          <ScreenState {...results} onRetry={results.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage="No encontramos jugadores con ese nombre.">
            {(page) => page && (
              <div className="flex flex-col gap-3">
                {page.content.filter((p) => p.id !== player.id).map((p) => (
                  <PlayerRow key={p.id} player={p} action={<Button loading={busy === p.id} onClick={() => act(p.id, () => friendshipsService.send(p.id), 'Solicitud enviada.')}>Agregar</Button>} />
                ))}
              </div>
            )}
          </ScreenState>
        </section>
      )}

      <h3 className="text-lg font-bold">Tu lista</h3>
      <ScreenState {...accepted} onRetry={accepted.refetch} isEmpty={() => friends.length === 0} emptyMessage="Aún no tienes Pongmigos">
        {() => (
          <div className="flex flex-col gap-3">
            {friends.map((f) => {
              const other = friendOf(f, player.id);
              return <PlayerRow key={f.id} player={other} action={<Button variant="secondary" loading={busy === f.id} onClick={() => act(f.id, () => friendshipsService.remove(f.id), 'Pongmigo eliminado.')}>Eliminar</Button>} />;
            })}
          </div>
        )}
      </ScreenState>
      {notice && <InfoPopup message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function PlayerRow({ player, action }: { player: PlayerSummary; action: ReactNode }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent"><Users aria-hidden className="size-5" /></div>
        <Link to={`/social/player/${player.id}`} className="min-w-0">
          <p className="truncate font-bold">{player.name}</p>
          <p className="text-xs text-muted">{Math.round(player.ratingGlicko)} pts</p>
        </Link>
      </div>
      {action}
    </Card>
  );
}

function InfoPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent"><Users className="size-5" /></div>
        <p className="text-sm text-muted">{message}</p>
        <Button onClick={onClose}>Aceptar</Button>
      </div>
    </div>
  );
}

function CreateCommunity({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('UNIVERSITY');
  const [customLabel, setCustomLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 3 && (type !== 'OTHER' || Boolean(customLabel.trim()));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const input: CommunityCreateInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        communityType: type,
        customLabel: type === 'OTHER' ? customLabel.trim() : undefined,
      };
      await communitiesService.create(input);
      onCreated();
    } catch (err) {
      const api = toApiError(err);
      setError(api.status === 409 ? 'Ya existe una comunidad con ese nombre.' : api.status === 403 ? 'Llegaste al límite de tu plan.' : api.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Crear comunidad</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="size-5" /></button>
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Descripción
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-xl border border-line bg-black px-3 py-2 outline-none focus:border-accent" />
        </label>
        <div className="flex flex-wrap gap-2">
          {CREATABLE_COMMUNITY_TYPES.map((option) => (
            <button key={option} type="button" onClick={() => setType(option)} className={`min-h-9 rounded-full px-3 text-sm font-bold ${type === option ? 'bg-primary text-white' : 'border border-line text-muted'}`}>
              {COMMUNITY_TYPE_LABELS[option]}
            </button>
          ))}
        </div>
        {type === 'OTHER' && (
          <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Etiqueta personalizada" className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
        )}
        {error && <p className="text-sm text-brand">{error}</p>}
        <Button type="submit" loading={loading} disabled={!canSubmit}>Crear</Button>
      </form>
    </div>
  );
}

