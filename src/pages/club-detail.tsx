import { ChevronLeft, Megaphone, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { toApiError } from '@/utils/api-error';
import { useState } from 'react';

export default function ClubDetailPage() {
  const { id } = useParams();
  const clubId = Number(id);
  const { player } = useSession();
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [clubId]);
  const members = useFetch((signal) => clubsService.members(clubId, signal), [clubId]);
  const announcements = useFetch((signal) => clubsService.announcements(clubId, signal), [clubId]);
  const pending = useFetch((signal) => clubsService.pending(clubId, signal), [clubId]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const request = async () => {
    setBusy(true);
    try {
      await clubsService.requestMembership(clubId);
      setNotice('Solicitud enviada.');
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const isMember = members.data?.some((m) => m.player?.id === player?.id);
  const isAdmin = members.data?.some((m) => m.player?.id === player?.id && m.role === 'CLUB_ADMIN') || club.data?.admin?.id === player?.id;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <ScreenState {...club} onRetry={club.refetch} isEmpty={() => false}>
        {(data) => (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">{data.name}</h1>
              <p className="text-sm text-muted">{data.address}</p>
              {data.description && <p className="mt-1 text-sm text-muted">{data.description}</p>}
              <p className="mt-1 text-xs font-bold text-gold">{data.status === 'PENDING' ? 'En revisión' : data.status === 'APPROVED' ? 'Aprobado' : data.status}</p>
            </div>
            {isAdmin && <Button variant="secondary" onClick={() => { setName(data.name); setAddress(data.address); setEditing(true); }}>Editar club</Button>}
            {editing && (
              <Card className="flex flex-col gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" />
                <div className="flex gap-2">
                  <Button onClick={async () => { await clubsService.update(clubId, { name, address }); setEditing(false); club.refetch(); }}>Guardar</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </Card>
            )}
            {!isMember && data.status === 'APPROVED' && <Button loading={busy} onClick={request}>Unirme</Button>}
            {isAdmin && (
              <section className="flex flex-col gap-2">
                <h2 className="font-bold">Solicitudes</h2>
                {(pending.data ?? []).length === 0 ? <p className="text-sm text-muted">Sin solicitudes.</p> : (pending.data ?? []).map((item) => (
                  <Card key={item.id} className="flex items-center justify-between gap-2">
                    <span className="font-bold">{item.player?.name ?? 'Jugador'}</span>
                    <div className="flex gap-2">
                      <Button onClick={async () => { await clubsService.reviewMembership(item.id, 'approve'); pending.refetch(); members.refetch(); }}>Aprobar</Button>
                      <Button variant="secondary" onClick={async () => { await clubsService.reviewMembership(item.id, 'reject'); pending.refetch(); }}>Rechazar</Button>
                    </div>
                  </Card>
                ))}
                <h2 className="font-bold">Nuevo anuncio</h2>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="min-h-11 rounded-xl border border-line bg-black px-3" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensaje" rows={2} className="rounded-xl border border-line bg-black px-3 py-2" />
                <Button onClick={async () => { if (!title.trim() || !body.trim()) return; await clubsService.createAnnouncement(clubId, { title, body }); setTitle(''); setBody(''); announcements.refetch(); }}>Publicar</Button>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Megaphone className="size-4" /> Anuncios</h2>
              {(Array.isArray(announcements.data) ? announcements.data : []).length === 0 ? <p className="text-sm text-muted">Sin anuncios.</p> : (announcements.data ?? []).map((item) => (
                <Card key={item.id}><p className="font-bold">{item.title}</p><p className="text-sm text-muted">{item.body}</p></Card>
              ))}
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Users className="size-4" /> Personas</h2>
              {(Array.isArray(members.data) ? members.data : []).map((member) => (
                <Card key={member.id} className="flex items-center justify-between">
                  <span className="font-bold">{member.player?.name ?? member.clubName}</span>
                  <span className="text-xs text-muted">{member.role === 'CLUB_ADMIN' ? 'Admin' : 'Miembro'}</span>
                </Card>
              ))}
            </section>
          </>
        )}
      </ScreenState>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}
