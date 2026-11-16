import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { paths } from '@/routes/paths';
import { matchesService, type Coordinates } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { FORMAT_LABELS } from '@/utils/match-status';

type OpenSort = 'level' | 'newest';

const SORT_OPTIONS: { value: OpenSort; label: string }[] = [
  { value: 'level', label: 'Nivel más parecido' },
  { value: 'newest', label: 'Más recientes' },
];

export default function FindMatchPage() {
  const location = useGeolocation();
  const { request } = location;

  useEffect(() => {
    request();
  }, [request]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[34px] leading-tight font-extrabold">Buscar partida</h1>
      {location.coords ? (
        <OpenMatches coords={location.coords} />
      ) : (
        <Card className="flex flex-col items-start gap-3">
          <p className={location.error ? 'text-brand' : 'text-muted'}>{location.error ?? 'Buscando tu ubicación para mostrar partidas cercanas…'}</p>
          <Button variant="secondary" loading={location.loading} onClick={request}>
            Reintentar
          </Button>
        </Card>
      )}
    </div>
  );
}

function OpenMatches({ coords }: { coords: Coordinates }) {
  const { player } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort: OpenSort = searchParams.get('sort') === 'newest' ? 'newest' : 'level';
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const open = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);
  const myRating = player!.ratingGlicko;

  const sorted = (matches: MatchResponse[]) =>
    matches
      .filter((match) => match.player1.id !== player!.id)
      .sort((a, b) =>
        sort === 'newest'
          ? b.createdAt.localeCompare(a.createdAt)
          : Math.abs(a.player1.ratingGlicko - myRating) - Math.abs(b.player1.ratingGlicko - myRating),
      );

  const join = async (matchId: number) => {
    setJoiningId(matchId);
    try {
      await matchesService.join(matchId, coords);
      toast.show('Te uniste a la partida. ¡A jugar!', 'success');
      navigate(paths.matchDetail(matchId));
    } catch (err) {
      const apiError = toApiError(err);
      toast.show(apiError.status === 409 ? 'Otro jugador tomó esa partida primero. Actualizamos la lista.' : apiError.message, 'error');
      if (apiError.status === 409 || apiError.status === 400) open.refetch();
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Partidas abiertas a menos de 5 km y con un rating parecido al tuyo.</p>
        <div className="flex items-center gap-3">
          <SelectField label="Orden" value={sort} options={SORT_OPTIONS} onChange={(value) => setSearchParams({ sort: value }, { replace: true })} />
          <Button variant="secondary" loading={open.loading && open.data !== null} onClick={open.refetch}>
            Actualizar
          </Button>
        </div>
      </div>
      <ScreenState {...open} onRetry={open.refetch} isEmpty={(data) => sorted(data).length === 0} emptyMessage="No hay partidas libres cerca de ti ahora mismo."
        emptyImage="/illustrations/pongi-rival.webp"
        emptyAction={
          <ButtonLink to={`${paths.newMatch}?mode=open`} icon={Plus}>
            Publicar mi propia partida
          </ButtonLink>
        }
      >
        {(matches) => (
          <ul className="flex flex-col gap-3">
            {sorted(matches).map((match) => {
              const gap = Math.round(match.player1.ratingGlicko - myRating);
              return (
                <li key={match.id}>
                  <Card className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{match.player1.name}</p>
                      <p className="text-sm text-muted">
                        <span className="font-bold text-accent tabular-nums">{Math.round(match.player1.ratingGlicko)}</span> ({gap >= 0 ? '+' : ''}
                        {gap} respecto a ti) · {FORMAT_LABELS[match.format]}
                      </p>
                    </div>
                    <Button loading={joiningId === match.id} disabled={joiningId !== null} onClick={() => join(match.id)} aria-label={`Unirme a la partida de ${match.player1.name}`}>
                      Unirme
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </ScreenState>
    </div>
  );
}
