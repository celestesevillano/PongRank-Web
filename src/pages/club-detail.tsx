import { BarChart3, ChevronLeft, ChevronRight, MapPin, Megaphone, Pencil, Shield, Trophy, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { formatTournamentDate, tournamentStatusLabel } from '@/components/tournaments/tournament-banner';
import { tournamentsService, type Tournament } from '@/services/tournaments.service';
import { toApiError } from '@/utils/api-error';

export default function ClubDetailPage() {
  const { id } = useParams();
  const clubId = Number(id);
  const navigate = useNavigate();
  const { player } = useSession();
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [clubId]);
  const members = useFetch((signal) => clubsService.members(clubId, signal), [clubId]);
  const announcements = useFetch((signal) => clubsService.announcements(clubId, signal), [clubId]);
  const pending = useFetch((signal) => clubsService.pending(clubId, signal), [clubId]);
  const tournaments = useFetch((signal) => tournamentsService.list(clubId, signal), [clubId]);
  const [panel, setPanel] = useState<'none' | 'requests' | 'ranking' | 'notices' | 'members' | 'edit' | 'transfer' | 'notice' | 'tournaments'>('ranking');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMember = members.data?.some((m) => m.player?.id === player?.id);
  const isAdmin = members.data?.some((m) => m.player?.id === player?.id && m.role === 'CLUB_ADMIN') || club.data?.admin?.id === player?.id;
  const memberCount = members.data?.length ?? 0;

  const request = async () => {
    setBusy(true);
    try { await clubsService.requestMembership(clubId); setNotice('Solicitud enviada.'); }
    catch (err) { setNotice(toApiError(err).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
        {isAdmin && <button type="button" aria-label="Editar club" onClick={() => { setName(club.data?.name ?? ''); setAddress(club.data?.address ?? ''); setPanel('edit'); }} className="rounded-full p-2 text-white hover:bg-white/10"><Pencil className="size-5" /></button>}
      </div>
      <ScreenState {...club} onRetry={club.refetch} isEmpty={() => false}>
        {(data) => (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
            <Card className="overflow-hidden p-0">
              <img src="/illustrations/club-portada.webp" alt="" className="h-36 w-full object-cover" />
              <div className="flex flex-col gap-1 p-4">
                <h1 className="text-2xl font-extrabold">{data.name}</h1>
                <p className="text-sm text-muted">{memberCount} {memberCount === 1 ? 'miembro' : 'miembros'} · Club</p>
                <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-4" /> {data.address}</p>
                {data.admin?.name && <p className="text-sm text-muted">Creado por {data.admin.name}</p>}
                {isAdmin && <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-[#24616A] px-2 py-0.5 text-xs font-bold text-accent"><Shield className="size-3.5" /> Administrador</span>}
              </div>
            </Card>

            {isAdmin && <Button icon={Trophy} onClick={() => navigate(`/social/club/${clubId}/create-tournament`)}>Crear torneo</Button>}
            {isAdmin && <Button variant="secondary" icon={Megaphone} onClick={() => setPanel('notice')}>Nuevo aviso</Button>}

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {isAdmin && <Row Icon={UserPlus} label="Solicitudes recibidas" count={pending.data?.length} onClick={() => setPanel(panel === 'requests' ? 'none' : 'requests')} />}
              <Row Icon={BarChart3} label="Ver ranking" subtitle="Posiciones y rating" onClick={() => setPanel(panel === 'ranking' ? 'none' : 'ranking')} />
              <Row Icon={Megaphone} label="Avisos" subtitle="Anuncios del club" onClick={() => setPanel(panel === 'notices' ? 'none' : 'notices')} />
              <Row Icon={Trophy} label="Torneos" subtitle={`${tournaments.data?.length ?? 0} torneos`} onClick={() => setPanel(panel === 'tournaments' ? 'none' : 'tournaments')} />
              <Row Icon={Users} label={isAdmin ? 'Gestionar miembros' : 'Ver miembros'} subtitle={`${memberCount} miembros`} onClick={() => setPanel(panel === 'members' ? 'none' : 'members')} last />
            </div>

            {isAdmin && <button type="button" onClick={() => setPanel('transfer')} className="text-center font-bold text-accent">Transferir administración</button>}

                        {!isMember && !isAdmin && data.status === 'APPROVED' && <Button loading={busy} onClick={request}>Solicitar ingreso</Button>}
            </div>
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            {panel === 'none' && <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">Elige una opción para ver su detalle aquí.</p>}
            {panel === 'ranking' && <Panel title="Ranking">{[...(members.data ?? [])].sort((a, b) => (b.player?.ratingGlicko ?? 0) - (a.player?.ratingGlicko ?? 0)).map((m, index) => <Card key={m.id} className="flex justify-between"><span className="font-bold">{index + 1}. {m.player?.name}</span><span className="text-gold">{Math.round(m.player?.ratingGlicko ?? 0)}</span></Card>)}</Panel>}
            {panel === 'requests' && <Panel title="Solicitudes">{(pending.data ?? []).length === 0 ? <p className="text-sm text-muted">Sin solicitudes.</p> : pending.data?.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2"><span className="font-bold">{item.player?.name}</span><div className="flex gap-2"><Button onClick={async () => { await clubsService.reviewMembership(item.id, 'approve'); pending.refetch(); members.refetch(); }}>Aprobar</Button><Button variant="secondary" onClick={async () => { await clubsService.reviewMembership(item.id, 'reject'); pending.refetch(); }}>Rechazar</Button></div></div>
            ))}</Panel>}
            {panel === 'notices' && <Panel title="Avisos">{(Array.isArray(announcements.data) ? announcements.data : []).length === 0 ? <p className="text-sm text-muted">Sin anuncios.</p> : announcements.data?.map((item) => <Card key={item.id}><p className="font-bold">{item.title}</p><p className="text-sm text-muted">{item.body}</p></Card>)}</Panel>}
            {panel === 'members' && <Panel title="Miembros">{(members.data ?? []).map((m) => <Card key={m.id} className="flex justify-between"><span className="font-bold">{m.player?.name}</span><span className="text-xs text-muted">{m.role === 'CLUB_ADMIN' ? 'Admin' : 'Miembro'}</span></Card>)}</Panel>}
            {panel === 'tournaments' && <Panel title="Torneos">{(tournaments.data ?? []).length === 0 ? <p className="text-sm text-muted">Todavía no hay torneos.</p> : tournaments.data?.map((t: Tournament) => <Link key={t.id} to={`/matches/tournaments/${t.id}`}><Card className="flex flex-col gap-1 border-[#71313B]"><span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Trophy className="size-3.5" /> {tournamentStatusLabel(t)}</span><span className="text-lg font-extrabold">{t.name}</span>{t.startDate && <span className="text-xs text-muted">{formatTournamentDate(t.startDate)}</span>}<span className="flex items-center justify-end gap-1 text-sm font-bold text-accent">Ver torneo<ChevronRight className="size-4" /></span></Card></Link>)}</Panel>}
            {panel === 'notice' && <Panel title="Nuevo aviso"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="min-h-11 rounded-xl border border-line bg-black px-3" /><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensaje" rows={2} className="rounded-xl border border-line bg-black px-3 py-2" /><Button onClick={async () => { if (!title.trim() || !body.trim()) return; await clubsService.createAnnouncement(clubId, { title, body }); setTitle(''); setBody(''); setPanel('notices'); announcements.refetch(); }}>Publicar</Button></Panel>}
            {panel === 'edit' && <Panel title="Editar club"><input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" /><input value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" /><div className="flex gap-2"><Button onClick={async () => { await clubsService.update(clubId, { name, address }); setPanel('none'); club.refetch(); }}>Guardar</Button><Button variant="secondary" onClick={() => setPanel('none')}>Cancelar</Button></div></Panel>}
            {panel === 'transfer' && <Panel title="Transferir administración">{(members.data ?? []).filter((m) => m.player?.id !== player?.id).map((m) => <Button key={m.id} variant="secondary" onClick={async () => { await clubsService.transfer(clubId, m.player!.id); setPanel('none'); members.refetch(); }}>{m.player?.name}</Button>)}<Button variant="secondary" onClick={() => setPanel('none')}>Cancelar</Button></Panel>}

            </div>
          </div>
        )}
      </ScreenState>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}

function Row({ Icon, label, subtitle, count, onClick, last }: { Icon: typeof Users; label: string; subtitle?: string; count?: number; onClick: () => void; last?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${last ? '' : 'border-b border-line'}`}>
      <Icon className="size-5 text-accent" />
      <span className="flex-1"><span className="block font-bold">{label}</span>{subtitle && <span className="block text-xs text-muted">{subtitle}</span>}</span>
      {!!count && <span className="rounded-full bg-primary px-2 text-xs font-bold text-white">{count}</span>}
      <ChevronRight className="size-4 text-muted" />
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-2"><h2 className="font-bold">{title}</h2>{children}</section>;
}
