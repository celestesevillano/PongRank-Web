import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { communitiesService } from '@/services/communities.service';
import { matchesService, type MatchCreateInput } from '@/services/matches.service';
import { toApiError } from '@/utils/api-error';

const FORMATS = [
  { value: 'BO3', label: 'Al mejor de 3' },
  { value: 'BO5', label: 'Al mejor de 5' },
  { value: 'BO7', label: 'Al mejor de 7' },
] as const;

type Scope = 'LOCATION' | 'COMMUNITY';

export default function NewMatchPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const communities = useFetch((signal) => communitiesService.mine(signal), []);
  const location = useGeolocation();
  const [format, setFormat] = useState<MatchCreateInput['format']>('BO5');
  const [scope, setScope] = useState<Scope>('LOCATION');
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCommunity = communityId ?? communities.data?.[0]?.id ?? null;
  const canSubmit = scope === 'LOCATION' ? location.coords !== null : selectedCommunity !== null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const input: MatchCreateInput =
        scope === 'LOCATION'
          ? { matchType: 'LOCATION', format, ...location.coords! }
          : { matchType: 'COMMUNITY', format, communityId: selectedCommunity! };
      const match = await matchesService.create(input);
      toast.show('Partida creada. Falta que se una un rival.', 'success');
      navigate(`/matches/${match.id}`);
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Crear partida</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-muted">Formato</legend>
          <div className="flex gap-2">
            {FORMATS.map((option) => (
              <label
                key={option.value}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-bold ${format === option.value ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}
              >
                {option.label}
                <input type="radio" name="format" className="sr-only" checked={format === option.value} onChange={() => setFormat(option.value)} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-muted">¿Quién puede unirse?</legend>
          <div className="flex gap-2">
            <label className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-bold ${scope === 'LOCATION' ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}>
              Jugadores cercanos
              <input type="radio" name="scope" className="sr-only" checked={scope === 'LOCATION'} onChange={() => setScope('LOCATION')} />
            </label>
            <label className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-bold ${scope === 'COMMUNITY' ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}>
              Mi comunidad
              <input type="radio" name="scope" className="sr-only" checked={scope === 'COMMUNITY'} onChange={() => setScope('COMMUNITY')} />
            </label>
          </div>
        </fieldset>

        {scope === 'LOCATION' ? (
          <Card className="flex flex-col items-start gap-2">
            {location.coords ? (
              <p className="text-sm text-emerald-300">Ubicación lista. Los rivales cercanos verán tu partida.</p>
            ) : (
              <>
                <p className={`text-sm ${location.error ? 'text-red-300' : 'text-muted'}`}>
                  {location.error ?? 'Necesitamos tu ubicación para que otros jugadores te encuentren.'}
                </p>
                <Button type="button" variant="secondary" loading={location.loading} onClick={location.request}>
                  Usar mi ubicación
                </Button>
              </>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="community" className="text-sm font-semibold text-muted">
              Comunidad
            </label>
            {communities.data && communities.data.length > 0 ? (
              <select
                id="community"
                value={selectedCommunity ?? ''}
                onChange={(e) => setCommunityId(Number(e.target.value))}
                className="rounded-xl border border-line bg-black px-3 py-2.5"
              >
                {communities.data.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted">
                {communities.loading ? 'Cargando tus comunidades…' : communities.error?.message ?? 'Aún no perteneces a ninguna comunidad. Únete a una desde Comunidades.'}
              </p>
            )}
          </div>
        )}

        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          Crear partida
        </Button>
      </form>
    </div>
  );
}
