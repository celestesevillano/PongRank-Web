import { CalendarClock, ChevronLeft, ChevronRight, Clock, LocateFixed, MapPin, Search, Swords, Users, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { OnboardingProgress } from '@/components/auth/onboarding-progress';
import { Spinner } from '@/components/common/spinner';
import { MatchMeta } from '@/components/matches/match-meta';
import { MatchState } from '@/components/matches/match-state';
import { PlayerIdentity } from '@/components/matches/player-identity';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MatchArt } from '@/lib/match-art';
import { paths } from '@/routes/paths';
import { CIRCLE_OPTIONS, matchRivals, type Circle, type MatchRival } from '@/services/match-circles.service';
import { matchesService } from '@/services/matches.service';
import type { MatchFormat } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { FORMAT_LABELS, matchTime } from '@/utils/match-status';

type Step = 1 | 2 | 3 | 4;

const FORMATS = (Object.keys(FORMAT_LABELS) as MatchFormat[]).map((value) => ({ value, label: FORMAT_LABELS[value] }));
const HOUR_MS = 3_600_000;
const clockText = (date: Date) => date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export default function NewMatchPage() {
  const [searchParams] = useSearchParams();
  const presetOpponent = Number(searchParams.get('opponentId')) || null;
  const { player } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useGeolocation();
  const { request: requestLocation } = location;
  const [step, setStep] = useState<Step>(presetOpponent ? 2 : 1);
  const [circle, setCircle] = useState<Circle>('friends');
  const [opponent, setOpponent] = useState<MatchRival | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim().toLocaleLowerCase(), 250);
  const [format, setFormat] = useState<MatchFormat>('BO3');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => new Date());
  const playerId = player!.id;

  const rivals = useFetch((signal) => (step === 2 ? matchRivals(circle, playerId, signal) : Promise.resolve([])), [step, circle, playerId]);
  const visible = (rivals.data ?? []).filter((rival) => rival.name.toLocaleLowerCase().includes(debouncedQuery));
  const selectedRival = opponent ?? (circle === 'friends' && presetOpponent ? visible.find((rival) => rival.id === presetOpponent) ?? null : null);
  const needsLocation = !opponent || circle === 'club';
  const place = location.coords ? 'Tu ubicación actual' : 'Sin ubicación';

  useEffect(() => {
    if (step === 3 && !location.coords && !location.loading && !location.error) requestLocation();
  }, [step, location.coords, location.loading, location.error, requestLocation]);

  const back = () => {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(opponent ? 2 : 1);
    else if (step === 2) setStep(1);
    else navigate(-1);
  };

  const submit = async () => {
    if (busy || (needsLocation && !location.coords)) return;
    if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
      toast.show('Elige una hora futura o selecciona Ahora mismo.', 'error');
      setStep(3);
      return;
    }
    const matchType = !opponent || circle === 'club' ? 'LOCATION' : circle === 'community' ? 'COMMUNITY' : 'FRIEND';
    setBusy(true);
    try {
      const match = await matchesService.create({
        matchType,
        format,
        opponentId: opponent?.id,
        communityId: matchType === 'COMMUNITY' ? opponent?.groupId : undefined,
        scheduledAt: scheduledAt?.toISOString(),
        ...(location.coords ?? {}),
      });
      toast.show(opponent ? `Partida creada contra ${opponent.name}.` : 'Partida publicada. Espera a que alguien se una.', 'success');
      navigate(paths.matchDetail(match.id), { replace: true });
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Button variant="text" icon={ChevronLeft} className="-ml-2 self-start" disabled={busy} onClick={back}>
        Volver
      </Button>
      <OnboardingProgress step={step} />

      {step === 1 && (
        <section className="flex flex-col gap-3">
          <h1 className="text-[26px] font-extrabold">¿Contra quién quieres jugar?</h1>
          <ChoiceCard
            icon={Users}
            title="Mi círculo social"
            description="Elige a alguien de Pongmigos, tus comunidades o tus clubes."
            onClick={() => {
              setOpponent(null);
              setStep(2);
            }}
          />
          <ChoiceCard
            icon={Swords}
            title="Dejar abierta"
            description="Publica la partida para que otro jugador pueda unirse."
            onClick={() => {
              setOpponent(null);
              setStep(3);
            }}
          />
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-3">
          <h1 className="text-[26px] font-extrabold">Elige a tu rival</h1>
          <SearchInput value={query} onChange={setQuery} />
          <ChipGroup
            label="Círculo"
            value={circle}
            options={[...CIRCLE_OPTIONS]}
            onChange={(value) => {
              setCircle(value);
              setOpponent(null);
            }}
          />
          <div role="radiogroup" aria-label="Rivales" className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
            {rivals.loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : rivals.error ? (
              <MatchState title="No pudimos cargar los jugadores" message={rivals.error.message} art={rivals.error.isNetwork ? MatchArt.offline : MatchArt.search}>
                <Button variant="secondary" onClick={rivals.refetch}>
                  Reintentar
                </Button>
              </MatchState>
            ) : visible.length === 0 ? (
              <MatchState title="No encontramos jugadores" message={query ? `Nadie coincide con “${query.trim()}”.` : 'Este círculo aún no tiene jugadores para retar.'} art={MatchArt.search} />
            ) : (
              visible.map((rival) => {
                const selected = rival.id === selectedRival?.id;
                return (
                  <button
                    key={rival.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setOpponent(rival)}
                    className={`flex items-center justify-between gap-3 rounded-[13px] border p-3 text-left transition ${selected ? 'border-brand bg-brand/10' : 'border-line bg-surface hover:border-muted'}`}
                  >
                    <PlayerIdentity player={{ name: rival.name, ratingGlicko: rival.ratingGlicko ?? 0, username: rival.username }} showRating={rival.ratingGlicko !== null} />
                    {rival.groupName && <span className="shrink-0 text-[13px] text-muted">{rival.groupName}</span>}
                  </button>
                );
              })
            )}
          </div>
          <Button
            disabled={!selectedRival || rivals.loading || !!rivals.error}
            onClick={() => {
              if (!selectedRival) return;
              setOpponent(selectedRival);
              setStep(3);
            }}
          >
            Continuar
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-[26px] font-extrabold">¿Dónde y cuándo?</h1>
          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-bold">Lugar</h2>
            {location.coords ? (
              <MatchMeta icon={MapPin} text={place} />
            ) : location.loading ? (
              <p className="flex items-center gap-2 text-[15px] text-muted">
                <Spinner /> Buscando tu ubicación…
              </p>
            ) : (
              <MatchState
                title="Activa tu ubicación"
                message={location.error ?? (needsLocation ? 'La necesitamos para que otros jugadores encuentren tu partida.' : 'Es opcional contra un rival de tu círculo.')}
                art={MatchArt.location}
              />
            )}
            <Button variant="secondary" icon={LocateFixed} loading={location.loading} onClick={requestLocation}>
              Usar mi ubicación actual
            </Button>
          </div>
          <Schedule value={scheduledAt} now={openedAt} onChange={setScheduledAt} />
          <Button disabled={needsLocation && !location.coords} onClick={() => setStep(4)}>
            Continuar
          </Button>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-[26px] font-extrabold">Formato de la partida</h1>
          <ChipGroup label="Formato" value={format} options={FORMATS} onChange={setFormat} />
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold">Sets a 11 puntos</p>
            <p className="text-[13px] text-muted">Si empatan a 10, hacen falta 2 puntos de ventaja.</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-brand bg-brand/10 p-4">
            <p className="font-bold">Resumen</p>
            {opponent ? (
              <PlayerIdentity player={{ name: opponent.name, ratingGlicko: opponent.ratingGlicko ?? 0, username: opponent.username }} showRating={opponent.ratingGlicko !== null} />
            ) : (
              <p className="font-bold">Partida abierta</p>
            )}
            <MatchMeta icon={MapPin} text={place} />
            <MatchMeta icon={Clock} text={scheduledAt ? matchTime(scheduledAt) : `Ahora · ${clockText(openedAt)}`} />
            <MatchMeta icon={Swords} text={FORMAT_LABELS[format]} />
          </div>
          <Button loading={busy} onClick={submit}>
            Crear partida
          </Button>
        </section>
      )}
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-[13px] border border-line bg-surface p-4 text-left transition hover:border-muted">
      <Icon aria-hidden className="size-5.5 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-[13px] text-muted">{description}</span>
      </span>
      <ChevronRight aria-hidden className="size-4.5 shrink-0 text-muted" />
    </button>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 focus-within:border-accent">
      <Search aria-hidden className="size-4.5 text-muted" />
      <label htmlFor={id} className="sr-only">
        Buscar jugador
      </label>
      <input id={id} type="search" value={value} placeholder="Buscar jugador" onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-white outline-none placeholder:text-muted" />
    </div>
  );
}

function Schedule({ value, now, onChange }: { value: Date | null; now: Date; onChange: (date: Date | null) => void }) {
  const id = useId();
  const [programming, setProgramming] = useState(value !== null);
  const minimum = toLocalInput(new Date(now.getTime() + 5 * 60_000));

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[15px] font-bold">Hora</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          icon={Clock}
          aria-pressed={!programming}
          className={`flex-1 ${!programming ? 'border-accent text-accent' : ''}`}
          onClick={() => {
            setProgramming(false);
            onChange(null);
          }}
        >
          Ahora mismo
        </Button>
        <Button
          variant="secondary"
          icon={CalendarClock}
          aria-pressed={programming}
          className={`flex-1 ${programming ? 'border-accent text-accent' : ''}`}
          onClick={() => {
            setProgramming(true);
            onChange(value ?? new Date(now.getTime() + HOUR_MS));
          }}
        >
          Programar
        </Button>
      </div>
      {programming ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="text-[13px] text-muted">
            Fecha y hora
          </label>
          <input
            id={id}
            type="datetime-local"
            min={minimum}
            value={value ? toLocalInput(value) : ''}
            onChange={(event) => onChange(event.target.value ? new Date(event.target.value) : null)}
            className="min-h-11 rounded-xl border border-line bg-surface px-3 text-white [color-scheme:dark] outline-none focus:border-accent"
          />
        </div>
      ) : (
        <p className="text-[13px] text-muted">Ahora · {clockText(now)}</p>
      )}
    </div>
  );
}
