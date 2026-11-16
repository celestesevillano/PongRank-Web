import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Stepper } from '@/components/common/stepper';
import { OpponentPicker, type OpponentOption } from '@/components/matches/opponent-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { paths } from '@/routes/paths';
import { communitiesService } from '@/services/communities.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { matchesService, type MatchCreateInput } from '@/services/matches.service';
import type { MatchFormat } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { FORMAT_LABELS } from '@/utils/match-status';

type Mode = 'friend' | 'community' | 'open';

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'friend', label: 'Un amigo', hint: 'Reta a alguien de tu lista de amigos.' },
  { value: 'community', label: 'Mi comunidad', hint: 'Elige un rival de tu club o universidad.' },
  { value: 'open', label: 'Partida abierta', hint: 'Jugadores cercanos de tu nivel podrán unirse.' },
];

const FORMATS = (Object.keys(FORMAT_LABELS) as MatchFormat[]).map((value) => ({ value, label: FORMAT_LABELS[value] }));
const STEPS = ['Modalidad', 'Rival', 'Formato'];
const MEMBERS_PAGE_SIZE = 100;

const isMode = (value: string | null): value is Mode => value === 'friend' || value === 'community' || value === 'open';

export default function NewMatchPage() {
  const { player } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode = isMode(modeParam) ? modeParam : null;

  const [step, setStep] = useState(mode ? 1 : 0);
  const [opponent, setOpponent] = useState<OpponentOption | null>(null);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [format, setFormat] = useState<MatchFormat>('BO3');
  const [submitting, setSubmitting] = useState(false);
  const location = useGeolocation();

  const myId = player!.id;
  const friends = useFetch(
    async (signal): Promise<OpponentOption[]> =>
      mode === 'friend' ? (await friendshipsService.accepted(myId, signal)).map((friendship) => friendOf(friendship, myId)) : [],
    [mode, myId],
  );
  const communities = useFetch((signal) => (mode === 'community' ? communitiesService.mine(signal) : Promise.resolve([])), [mode]);
  const selectedCommunityId = communityId ?? communities.data?.[0]?.id ?? null;
  const members = useFetch(
    async (signal): Promise<OpponentOption[]> => {
      if (mode !== 'community' || selectedCommunityId === null) return [];
      const page = await communitiesService.members(selectedCommunityId, { size: MEMBERS_PAGE_SIZE }, signal);
      return page.content
        .filter((member) => member.playerId !== myId && member.status === 'ACTIVE')
        .map((member) => ({ id: member.playerId, name: member.playerName, ratingGlicko: member.ratingGlicko }));
    },
    [mode, selectedCommunityId, myId],
  );

  const chooseMode = (value: Mode) => {
    setOpponent(null);
    setSearchParams({ mode: value }, { replace: true });
  };

  const rivalReady = mode === 'open' ? location.coords !== null : opponent !== null;
  const communityName = communities.data?.find((community) => community.id === selectedCommunityId)?.name;

  const buildInput = (): MatchCreateInput => {
    if (mode === 'friend') return { matchType: 'FRIEND', format, opponentId: opponent!.id };
    if (mode === 'community') return { matchType: 'COMMUNITY', format, opponentId: opponent!.id, communityId: selectedCommunityId! };
    return { matchType: 'LOCATION', format, ...location.coords! };
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const match = await matchesService.create(buildInput());
      toast.show(mode === 'open' ? 'Partida publicada. Te avisaremos cuando se una un rival.' : `Partida creada contra ${opponent!.name}.`, 'success');
      navigate(paths.matchDetail(match.id));
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <h1 className="text-[34px] leading-tight font-extrabold">Crear partida</h1>
      <Stepper steps={mode === 'open' ? ['Modalidad', 'Ubicación', 'Formato'] : STEPS} current={step} />

      {step === 0 && (
        <>
          <ChoiceGroup legend="¿Contra quién quieres jugar?" name="mode" options={MODES} value={mode} onChange={chooseMode} />
          <Button disabled={mode === null} onClick={() => setStep(1)} className="self-end">
            Continuar
          </Button>
        </>
      )}

      {step === 1 && mode === 'friend' && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-bold">Elige a tu amigo</h2>
          <OpponentPicker
            options={friends.data}
            loading={friends.loading}
            error={friends.error}
            selectedId={opponent?.id ?? null}
            emptyMessage="Aún no tienes amigos agregados. Prueba con una partida abierta o de comunidad."
            onRetry={friends.refetch}
            onSelect={setOpponent}
          />
        </Card>
      )}

      {step === 1 && mode === 'community' && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-bold">Elige a tu rival</h2>
          {communities.data && communities.data.length > 0 ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
                Comunidad
                <select
                  value={selectedCommunityId ?? ''}
                  onChange={(event) => {
                    setCommunityId(Number(event.target.value));
                    setOpponent(null);
                  }}
                  className="rounded-xl border border-line bg-black px-3 py-2.5 font-normal text-white"
                >
                  {communities.data.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>
              <OpponentPicker
                options={members.data}
                loading={members.loading}
                error={members.error}
                selectedId={opponent?.id ?? null}
                emptyMessage="Eres el único miembro de esta comunidad por ahora."
                onRetry={members.refetch}
                onSelect={setOpponent}
              />
            </>
          ) : communities.loading ? (
            <p className="text-sm text-muted">Cargando tus comunidades…</p>
          ) : communities.error ? (
            <p className="text-sm text-brand">{communities.error.message}</p>
          ) : (
            <p className="text-sm text-muted">
              Aún no perteneces a ninguna comunidad.{' '}
              <Link to={paths.communities} className="font-bold text-accent">
                Únete a una
              </Link>
            </p>
          )}
        </Card>
      )}

      {step === 1 && mode === 'open' && (
        <Card className="flex flex-col items-start gap-2">
          <h2 className="font-bold">Tu ubicación</h2>
          {location.coords ? (
            <p className="text-sm text-success">Ubicación lista. Jugadores a menos de 5 km y con un rating parecido al tuyo verán tu partida.</p>
          ) : (
            <>
              <p className={`text-sm ${location.error ? 'text-brand' : 'text-muted'}`}>
                {location.error ?? 'La usamos solo para que jugadores cercanos encuentren tu partida.'}
              </p>
              <Button type="button" variant="secondary" loading={location.loading} onClick={location.request}>
                Usar mi ubicación
              </Button>
            </>
          )}
        </Card>
      )}

      {step === 1 && (
        <div className="flex justify-between">
          <Button variant="text" onClick={() => setStep(0)}>
            Volver
          </Button>
          <Button disabled={!rivalReady} onClick={() => setStep(2)}>
            Continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <>
          <ChoiceGroup legend="Formato" name="format" options={FORMATS} value={format} onChange={setFormat} />
          <Card>
            <h2 className="text-sm font-semibold text-muted">Resumen</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">Rival</dt>
              <dd className="font-bold">{mode === 'open' ? 'El primero cercano que se una' : opponent?.name}</dd>
              {mode === 'community' && (
                <>
                  <dt className="text-muted">Comunidad</dt>
                  <dd className="font-bold">{communityName}</dd>
                </>
              )}
              <dt className="text-muted">Formato</dt>
              <dd className="font-bold">{FORMAT_LABELS[format]}</dd>
            </dl>
          </Card>
          <div className="flex justify-between">
            <Button variant="text" disabled={submitting} onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button loading={submitting} onClick={submit}>
              {mode === 'open' ? 'Publicar partida' : 'Crear partida'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
