import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { matchesService, type Coordinates } from '@/services/matches.service';
import { toApiError } from '@/utils/api-error';

export default function FindMatchPage() {
  const { player } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useGeolocation();
  const [joiningId, setJoiningId] = useState<number | null>(null);

  useEffect(() => {
    location.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!location.coords) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">Buscar partida</h1>
        <Card className="flex flex-col items-start gap-3">
          <p className={location.error ? 'text-red-300' : 'text-muted'}>
            {location.error ?? 'Buscando tu ubicación para mostrar partidas cercanas…'}
          </p>
          <Button variant="secondary" loading={location.loading} onClick={location.request}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <OpenMatches
      coords={location.coords}
      playerId={player!.id}
      joiningId={joiningId}
      onJoin={async (matchId) => {
        setJoiningId(matchId);
        try {
          await matchesService.join(matchId, location.coords!);
          toast.show('Te uniste a la partida.', 'success');
          navigate(`/matches/${matchId}`);
        } catch (err) {
          toast.show(toApiError(err).message, 'error');
          setJoiningId(null);
        }
      }}
    />
  );
}

type OpenMatchesProps = { coords: Coordinates; playerId: number; joiningId: number | null; onJoin: (matchId: number) => void };

function OpenMatches({ coords, playerId, joiningId, onJoin }: OpenMatchesProps) {
  const open = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Buscar partida</h1>
      <ScreenState
        {...open}
        onRetry={open.refetch}
        isEmpty={(data) => data.filter((match) => match.player1.id !== playerId).length === 0}
        emptyMessage="No hay partidas libres cerca de ti. Crea una y espera a un rival."
      >
        {(matches) => (
          <div className="flex flex-col gap-3">
            {matches
              .filter((match) => match.player1.id !== playerId)
              .map((match) => (
                <Card key={match.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {match.player1.name} · {Math.round(match.player1.ratingGlicko)}
                    </p>
                    <p className="text-sm text-muted">
                      {match.format} · {match.communityName ?? 'Partida libre'}
                    </p>
                  </div>
                  <Button loading={joiningId === match.id} disabled={joiningId !== null} onClick={() => onJoin(match.id)}>
                    Unirme
                  </Button>
                </Card>
              ))}
          </div>
        )}
      </ScreenState>
    </div>
  );
}
