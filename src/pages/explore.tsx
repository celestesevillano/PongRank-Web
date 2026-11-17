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

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'players', label: 'Jugadores' },
  { key: 'clubs', label: 'Clubes' },
  { key: 'communities', label: 'Comunidades' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const name = useDebounce(query.trim(), 300);
  const ready = name.length >= 2;
  const showPlayers = ready && (filter === 'all' || filter === 'players');
  const showClubs = filter === 'all' || filter === 'clubs';
  const showCommunities = filter === 'all' || filter === 'communities';

  const communities = useFetch((signal) => showCommunities && ready ? communitiesService.search({ page: 0, size: 10, name }, signal) : Promise.resolve(null), [name, showCommunities, ready]);
  const clubs = useFetch((signal) => showClubs && ready ? clubsService.search({ page: 0, size: 10, name }, signal) : Promise.resolve(null), [name, showClubs, ready]);
  const players = useFetch((signal) => showPlayers ? playersService.search(name, { page: 0, size: 10 }, signal) : Promise.resolve(null), [name, showPlayers]);

  const sections = [
    showCommunities && { title: 'Comunidades', state: communities, empty: 'No encontramos comunidades con ese nombre.', render: (item: { id: number; name: string }) => <Card key={item.id}><Link to={`/social/community/${item.id}`} className="font-bold">{item.name}</Link></Card> },
    showClubs && { title: 'Clubes', state: clubs, empty: 'No encontramos clubes con ese nombre.', render: (item: { id: number; name: string }) => <Card key={item.id}><Link to={`/social/club/${item.id}`} className="font-bold">{item.name}</Link></Card> },
    showPlayers && { title: 'Jugadores', state: players, empty: 'No encontramos a nadie con ese nombre.', render: (item: { id: number; name: string }) => <Card key={item.id}><Link to={`/social/player/${item.id}`} className="font-bold">{item.name}</Link></Card> },
  ].filter(Boolean) as { title: string; state: typeof communities; empty: string; render: (item: { id: number; name: string }) => React.ReactNode }[];

  const allEmpty = ready && sections.length > 0 && sections.every((section) => section.state.data && section.state.data.content.length === 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Buscar en Social</h1>
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Comunidad, club o jugador" className="min-h-11 w-full rounded-xl border border-line bg-black py-2.5 pr-3 pl-10 outline-none focus:border-accent" />
      </label>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`min-h-9 rounded-full border px-4 text-sm font-bold ${filter === item.key ? 'border-primary bg-primary text-white' : 'border-line text-muted'}`}>{item.label}</button>
        ))}
      </div>
      {!ready ? (
        <Empty art="/illustrations/pongi-pongmigos-busqueda.webp" text="Busca una comunidad, un club o un jugador." />
      ) : allEmpty ? (
        <Empty art="/illustrations/pongi-pongmigos-busqueda.webp" text="No se encontraron resultados para esa búsqueda." />
      ) : sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="font-bold">{section.title}</h2>
          <ScreenState {...section.state} onRetry={section.state.refetch} isEmpty={(data) => !data || data.content.length === 0} emptyMessage={section.empty} emptyImage="/illustrations/pongi-pongmigos-busqueda.webp">
            {(page) => page && <div className="flex flex-col gap-2">{page.content.map(section.render)}</div>}
          </ScreenState>
        </section>
      ))}
    </div>
  );
}

function Empty({ art, text }: { art: string; text: string }) {
  return <div className="flex flex-col items-center gap-2 py-8"><img src={art} alt="" className="w-40" /><p className="text-sm text-muted">{text}</p></div>;
}
