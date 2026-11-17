import { ChevronLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { playersService } from '@/services/players.service';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query.trim());
  const communities = useFetch((signal) => debounced.length >= 2 ? communitiesService.search({ name: debounced, page: 0, size: 10 }, signal) : Promise.resolve(null), [debounced]);
  const clubs = useFetch((signal) => debounced.length >= 2 ? clubsService.search({ name: debounced, page: 0, size: 10 }, signal) : Promise.resolve(null), [debounced]);
  const players = useFetch((signal) => debounced.length >= 2 ? playersService.search(debounced, { page: 0, size: 10 }, signal) : Promise.resolve(null), [debounced]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Buscar en Social</h1>
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Comunidad, club o jugador" className="min-h-11 w-full rounded-xl border border-line bg-black py-2.5 pr-3 pl-10 outline-none focus:border-accent" />
      </label>
      {debounced.length < 2 ? (
        <img src="/illustrations/pongi-pongmigos-busqueda.webp" alt="" className="mx-auto w-40" />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="font-bold">Comunidades</h2>
            <ScreenState {...communities} onRetry={communities.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage="Sin comunidades.">
              {(page) => page && <div className="flex flex-col gap-2">{page.content.map((item) => <Card key={item.id}><Link to={`/social/community/${item.id}`} className="font-bold">{item.name}</Link></Card>)}</div>}
            </ScreenState>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-bold">Clubes</h2>
            <ScreenState {...clubs} onRetry={clubs.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage="Sin clubes aprobados.">
              {(page) => page && <div className="flex flex-col gap-2">{page.content.map((item) => <Card key={item.id}><Link to={`/social/club/${item.id}`} className="font-bold">{item.name}</Link></Card>)}</div>}
            </ScreenState>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-bold">Jugadores</h2>
            <ScreenState {...players} onRetry={players.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage="Sin jugadores.">
              {(page) => page && <div className="flex flex-col gap-2">{page.content.map((item) => <Card key={item.id}><Link to={`/social/player/${item.id}`} className="font-bold">{item.name}</Link></Card>)}</div>}
            </ScreenState>
          </section>
        </>
      )}
    </div>
  );
}
