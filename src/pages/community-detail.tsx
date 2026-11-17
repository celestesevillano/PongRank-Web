import { ChevronLeft, Pencil, Share2, Shield, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { COMMUNITY_TYPE_LABELS } from '@/utils/community-types';

const MEDALS = ['#FFD278', '#D4D8E0', '#EAA578'];

export default function CommunityDetailPage() {
  const { id } = useParams();
  const communityId = Number(id);
  const navigate = useNavigate();
  const { player } = useSession();
  const detail = useFetch((signal) => communitiesService.detail(communityId, signal), [communityId]);
  const members = useFetch((signal) => communitiesService.members(communityId, { page: 0, size: 50 }, signal), [communityId]);
  const ranking = useFetch((signal) => communitiesService.ranking(communityId, { page: 0, size: 3 }, signal), [communityId]);
  const [panel, setPanel] = useState<'none' | 'edit' | 'members' | 'transfer'>('none');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isMember = members.data?.content.some((m) => m.playerId === player?.id);
  const isAdmin = members.data?.content.some((m) => m.playerId === player?.id && m.role === 'COMMUNITY_ADMIN');
  const top = ranking.data?.content.slice(0, 3) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
        <div className="flex gap-1">
          {isAdmin && <button type="button" aria-label="Editar" onClick={() => { setName(detail.data?.name ?? ''); setDescription(detail.data?.description ?? ''); setPanel('edit'); }} className="rounded-full p-2 hover:bg-white/10"><Pencil className="size-5" /></button>}
          {isAdmin && <button type="button" aria-label="Transferir" onClick={() => setPanel('transfer')} className="rounded-full p-2 hover:bg-white/10"><Share2 className="size-5" /></button>}
        </div>
      </div>

      <ScreenState {...detail} onRetry={detail.refetch} isEmpty={() => false}>
        {(data) => (
          <>
            <Card className="overflow-hidden p-0">
              <div className="relative">
                <img src="/illustrations/pongrank-comunidad-portada.webp" alt="" className="h-36 w-full object-cover" />
                <span className="absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-lg bg-[#12323A] text-sm font-black">{data.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex flex-col gap-1 p-4">
                <h1 className="text-2xl font-extrabold">{data.name}</h1>
                <p className="text-sm text-muted">{data.memberCount} {data.memberCount === 1 ? 'miembro' : 'miembros'} · {COMMUNITY_TYPE_LABELS[data.communityType] ?? data.communityType}</p>
                {isAdmin ? <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-[#24616A] px-2 py-0.5 text-xs font-bold text-accent"><Shield className="size-3.5" /> Administrador</span>
                  : isMember && <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-[#1F6B3A] px-2 py-0.5 text-xs font-bold text-[#4ADE80]"><Users className="size-3.5" /> Eres miembro</span>}
              </div>
            </Card>

            <section>
              <h2 className="text-lg font-extrabold">Sobre la comunidad</h2>
              <p className="mt-1 text-muted">{data.description || 'Sin descripción.'}</p>
            </section>

            <Card className="border-[#8E703B]">
              <h2 className="mb-3 flex items-center gap-2 font-extrabold"><Trophy className="size-5 text-gold" /> Top 3 de la comunidad</h2>
              {top.length === 0 ? <p className="text-sm text-muted">Aún no hay ranking.</p> : top.map((entry, index) => (
                <div key={entry.playerId} className="flex items-center gap-3 py-2">
                  <span className="flex size-7 items-center justify-center rounded-full text-sm font-black" style={{ background: `${MEDALS[index]}22`, color: MEDALS[index] }}>{index + 1}</span>
                  <span className="flex-1 font-bold">{entry.playerName}</span>
                  <span className="font-extrabold" style={{ color: MEDALS[index] }}>{Math.round(entry.ratingGlicko)}</span>
                </div>
              ))}
            </Card>

            <div className="flex gap-2">
              {isAdmin && <Button variant="secondary" className="flex-1" onClick={() => setPanel(panel === 'members' ? 'none' : 'members')}>Ver miembros</Button>}
              <Button icon={Trophy} className="flex-1" onClick={() => navigate('/ranking')}>Ver ranking</Button>
            </div>

            {panel === 'members' && <section className="flex flex-col gap-2">{(members.data?.content ?? []).map((m) => <Card key={m.playerId} className="flex justify-between"><span className="font-bold">{m.playerName}</span><span className="text-xs text-muted">{m.role === 'COMMUNITY_ADMIN' ? 'Admin' : 'Miembro'}</span></Card>)}</section>}
            {panel === 'edit' && <section className="flex flex-col gap-2"><input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" /><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-xl border border-line bg-black px-3 py-2" /><div className="flex gap-2"><Button onClick={async () => { await communitiesService.update(communityId, { name, description }); setPanel('none'); detail.refetch(); }}>Guardar</Button><Button variant="secondary" onClick={() => setPanel('none')}>Cancelar</Button></div></section>}
            {panel === 'transfer' && <section className="flex flex-col gap-2"><h2 className="font-bold">Transferir administración</h2>{(members.data?.content ?? []).filter((m) => m.playerId !== player?.id).map((m) => <Button key={m.playerId} variant="secondary" onClick={async () => { await communitiesService.transfer(communityId, m.playerId); setPanel('none'); members.refetch(); }}>{m.playerName}</Button>)}</section>}
          </>
        )}
      </ScreenState>
    </div>
  );
}
