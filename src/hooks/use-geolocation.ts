import { useCallback, useState } from 'react';

import type { Coordinates } from '@/services/matches.service';

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Necesitamos tu permiso de ubicación para mostrar partidas cercanas. Actívalo en el navegador y vuelve a intentar.',
  2: 'No pudimos determinar tu ubicación. Revisa tu conexión o el GPS.',
  3: 'Tu ubicación tardó demasiado en responder. Intenta de nuevo.',
};

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLoading(false);
      },
      (failure) => {
        setError(ERROR_MESSAGES[failure.code] ?? 'No pudimos obtener tu ubicación.');
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { coords, error, loading, request };
}
