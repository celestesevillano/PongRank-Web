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
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
            {!isMember && data.status === 'APPROVED' && <Button loading={busy} onClick={request}>Unirme</Button>}
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Megaphone className="size-4" /> Anuncios</h2>
              {(announcements.data ?? []).length === 0 ? <p className="text-sm text-muted">Sin anuncios.</p> : (announcements.data ?? []).map((item) => (
                <Card key={item.id}><p className="font-bold">{item.title}</p><p className="text-sm text-muted">{item.body}</p></Card>
              ))}
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Users className="size-4" /> Personas</h2>
              {(members.data ?? []).map((member) => (
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
