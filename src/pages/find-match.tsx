import { ChevronLeft, MapPin, Plus, RefreshCw, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Spinner } from '@/components/common/spinner';
import { MatchMeta } from '@/components/matches/match-meta';
import { MatchState } from '@/components/matches/match-state';
import { PlayerIdentity } from '@/components/matches/player-identity';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { ChipGroup } from '@/components/ui/chip-group';
import { SelectField } from '@/components/ui/select-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MatchArt } from '@/lib/match-art';
import { paths } from '@/routes/paths';
import { CIRCLE_OPTIONS, matchRivals } from '@/services/match-circles.service';
import { matchesService, type Coordinates } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { FORMAT_LABELS, matchPlace } from '@/utils/match-status';

const TABS = [...CIRCLE_OPTIONS, { value: 'open', label: 'Libres' }] as const;
type Tab = (typeof TABS)[number]['value'];

const EMPTY_TEXT: Record<Tab, string> = {
  friends: 'Ninguno de tus Pongmigos tiene una partida abierta.',
  community: 'No hay partidas abiertas en tus comunidades.',
  club: 'No hay partidas abiertas en tus clubes.',
  open: 'No hay partidas libres cerca de ti.',
};

type OpenSort = 'level' | 'newest';

const SORT_OPTIONS: { value: OpenSort; label: string }[] = [
  { value: 'level', label: 'Nivel más parecido' },
  { value: 'newest', label: 'Más recientes' },
];

const isTab = (value: string | null): value is Tab => TABS.some((tab) => tab.value === value);

export default function FindMatchPage() {
  const navigate = useNavigate();
  const location = useGeolocation();
  const { request } = location;

  useEffect(() => {
    request();
  }, [request]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Button variant="text" icon={ChevronLeft} className="-ml-2 self-start" onClick={() => navigate(-1)}>
        Volver
      </Button>
      <h1 className="text-[34px] leading-tight font-extrabold">Buscar partida</h1>
      {location.coords ? (
        <OpenMatches coords={location.coords} />
      ) : location.loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <MatchState title="Activa tu ubicación" message={location.error ?? 'Necesitamos tu ubicación para mostrar partidas cerca de ti.'} art={MatchArt.location}>
          <Button variant="secondary" icon={RefreshCw} onClick={request}>
            Reintentar
          </Button>
        </MatchState>
      )}
    </div>
  );
}

function OpenMatches({ coords }: { coords: Coordinates }) {
  const { player } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'friends';
  const sort: OpenSort = searchParams.get('sort') === 'newest' ? 'newest' : 'level';
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const playerId = player!.id;
  const myRating = player!.ratingGlicko;

  const matches = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);
  const circle = useFetch((signal) => (tab === 'open' ? Promise.resolve([]) : matchRivals(tab, playerId, signal)), [tab, playerId]);
  const loading = (matches.loading && !matches.data) || (tab !== 'open' && circle.loading);
  const error = matches.error ?? (tab === 'open' ? null : circle.error);
  const members = new Map((circle.data ?? []).map((rival) => [rival.id, rival.groupName]));

  const visible = (matches.data ?? [])
    .filter((match) => match.player1.id !== playerId && (tab === 'open' || members.has(match.player1.id)))
    .sort((a, b) =>
      sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : Math.abs(a.player1.ratingGlicko - myRating) - Math.abs(b.player1.ratingGlicko - myRating),
    );

  const updateParams = (changes: Record<string, string>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => next.set(key, value));
        return next;
      },
      { replace: true },
    );

  const join = async (match: MatchResponse) => {
    if (joiningId !== null) return;
    setJoiningId(match.id);
    try {
      const joined = await matchesService.join(match.id, coords);
      toast.show(`Te uniste a la partida de ${match.player1.name}.`, 'success');
      navigate(paths.matchDetail(joined.id), { replace: true });
    } catch (err) {
      const apiError = toApiError(err);
      toast.show(apiError.status === 409 ? 'Otro jugador tomó esa partida primero. Actualizamos la lista.' : apiError.message, 'error');
      matches.refetch();
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChipGroup label="Círculo" value={tab} options={[...TABS]} onChange={(value) => updateParams({ tab: value })} />
        <SelectField label="Orden" value={sort} options={SORT_OPTIONS} onChange={(value) => updateParams({ sort: value })} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <MatchState
          title={error.isNetwork ? 'Problema de conexión' : 'No pudimos cargar las partidas'}
          message={error.isNetwork ? 'No pudimos conectar con PongRank. Revisa tu conexión.' : 'Intenta de nuevo en unos momentos.'}
          art={error.isNetwork ? MatchArt.offline : undefined}
        >
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => {
              matches.refetch();
              circle.refetch();
            }}
          >
            Reintentar
          </Button>
        </MatchState>
      ) : visible.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((match) => (
            <li key={match.id}>
              <OpenMatchCard match={match} group={members.get(match.player1.id)} joining={joiningId === match.id} disabled={joiningId !== null} onJoin={() => join(match)} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <MatchState title="Sin partidas abiertas" message={EMPTY_TEXT[tab]} art={MatchArt.search} />
          <ButtonLink to={paths.newMatch} icon={Plus}>
            Nueva partida
          </ButtonLink>
        </>
      )}
    </div>
  );
}

type OpenMatchCardProps = { match: MatchResponse; group?: string; joining: boolean; disabled: boolean; onJoin: () => void };

function OpenMatchCard({ match, group, joining, disabled, onJoin }: OpenMatchCardProps) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-[13px] border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <PlayerIdentity player={match.player1} showRating />
        <span className="shrink-0 text-xs font-bold text-muted">{FORMAT_LABELS[match.format]}</span>
      </div>
      <MatchMeta icon={MapPin} text={group ?? matchPlace(match) ?? 'Partida libre'} />
      <Button icon={UserPlus} loading={joining} disabled={disabled} onClick={onJoin} aria-label={`Unirme a la partida de ${match.player1.name}`} className="mt-auto">
        Unirme
      </Button>
    </article>
  );
}
