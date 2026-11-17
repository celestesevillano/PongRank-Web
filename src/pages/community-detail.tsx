import { ChevronLeft, Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';
import { COMMUNITY_TYPE_LABELS } from '@/utils/community-types';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const communityId = Number(id);
  const navigate = useNavigate();
  const { player } = useSession();
  const detail = useFetch((signal) => communitiesService.detail(communityId, signal), [communityId]);
  const members = useFetch((signal) => communitiesService.members(communityId, { page: 0, size: 50 }, signal), [communityId]);
  const ranking = useFetch((signal) => communitiesService.ranking(communityId, { page: 0, size: 5 }, signal), [communityId]);
  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const isMember = members.data?.content.some((m) => m.playerId === player?.id);
  const isAdmin = members.data?.content.some((m) => m.playerId === player?.id && m.role === 'COMMUNITY_ADMIN');

  const leave = async () => {
    if (!player) return;
    try {
      await communitiesService.leave(communityId, player.id);
      navigate('/social');
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setLeaving(false);
    }
  };

  const save = async () => {
    try {
      await communitiesService.update(communityId, { name: name.trim() });
      setEditing(false);
      detail.refetch();
      setNotice('Comunidad actualizada.');
    } catch (err) {
      setNotice(toApiError(err).message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <ScreenState {...detail} onRetry={detail.refetch} isEmpty={() => false}>
        {(community) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold">{community.name}</h1>
                <p className="text-sm text-muted">{COMMUNITY_TYPE_LABELS[community.communityType]} · {community.memberCount} miembros</p>
                {community.description && <p className="mt-1 text-sm text-muted">{community.description}</p>}
              </div>
              {isAdmin && <Button variant="secondary" icon={Pencil} onClick={() => { setName(community.name); setEditing(true); }}>Editar</Button>}
            </div>
            {editing && (
              <Card className="flex flex-col gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
                <div className="flex gap-2"><Button onClick={save}>Guardar</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button></div>
              </Card>
            )}
            <section className="flex flex-col gap-2">
              <h2 className="font-bold">Top</h2>
              {(ranking.data?.content ?? []).map((entry) => (
                <Card key={entry.playerId} className="flex justify-between"><span>#{entry.position} {entry.playerName}</span><span className="font-bold">{Math.round(entry.ratingGlicko)}</span></Card>
              ))}
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Users className="size-4" /> Miembros</h2>
              {(members.data?.content ?? []).map((member) => (
                <Card key={member.playerId} className="flex items-center justify-between">
                  <Link to={`/social/player/${member.playerId}`} className="font-bold hover:underline">{member.playerName}</Link>
                  <span className="text-xs text-muted">{member.role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Miembro'}</span>
                </Card>
              ))}
            </section>
            {isMember && <Button variant="secondary" onClick={() => setLeaving(true)}>Salir</Button>}
          </>
        )}
      </ScreenState>
      <ConfirmDialog open={leaving} title="¿Salir de la comunidad?" message="Dejarás de aparecer en su ranking." confirmLabel="Salir" onCancel={() => setLeaving(false)} onConfirm={leave} />
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="rounded-2xl bg-surface p-6 text-center"><p className="text-sm text-muted">{notice}</p><Button className="mt-3" onClick={() => setNotice(null)}>Aceptar</Button></div></div>}
    </div>
  );
}
