import { useId, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { OnboardingProgress } from '@/components/auth/onboarding-progress';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/context/registration';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { playersService } from '@/services/players.service';
import { toApiError } from '@/utils/api-error';
import { INITIAL_LEVELS } from '@/utils/levels';

const DEFAULT_LEVEL_INDEX = 2;

export default function RegisterLevelPage() {
  const { draft, clearDraft } = useRegistration();
  const { signInWithAuthResponse } = useSession();
  const navigate = useNavigate();
  const sliderId = useId();
  const federationId = useId();
  const [levelIndex, setLevelIndex] = useState(DEFAULT_LEVEL_INDEX);
  const [federated, setFederated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; suggestLogin: boolean } | null>(null);

  const selected = INITIAL_LEVELS[levelIndex];
  const canDeclareFederation = selected.value === 'ADVANCED' || selected.value === 'EXPERT';
  const wantsFederation = canDeclareFederation && federated;
  const birthDate = draft?.birthDate;
  const gender = draft?.gender;
  const canSuggest = Boolean(birthDate && gender && gender !== 'PREFER_NOT_TO_SAY');

  const suggestion = useFetch(
    (signal) => (wantsFederation && birthDate && gender && gender !== 'PREFER_NOT_TO_SAY' ? playersService.suggestFdptmCategory(birthDate, gender, signal) : Promise.resolve(null)),
    [wantsFederation, birthDate, gender],
  );
  const category = wantsFederation && !suggestion.loading && suggestion.data ? suggestion.data : null;

  if (!draft) return <Navigate to={paths.register} replace />;
  if (!draft.birthDate || !draft.gender) return <Navigate to={paths.registerAbout} replace />;

  const changeLevel = (index: number) => {
    setLevelIndex(index);
    const value = INITIAL_LEVELS[index].value;
    if (value !== 'ADVANCED' && value !== 'EXPERT') setFederated(false);
  };

  const submit = async () => {
    if (saving || !draft.birthDate || !draft.gender || (wantsFederation && !category)) return;
    setSaving(true);
    setError(null);
    try {
      const auth = await authService.register({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        birthDate: draft.birthDate,
        gender: draft.gender,
        initialLevel: selected.value,
        ...(wantsFederation && category ? { federatedDeclared: true, categoryFdptm: category } : {}),
      });
      await signInWithAuthResponse(auth, { onboarding: true });
      clearDraft();
      navigate(paths.registerCommunity, { replace: true });
    } catch (err) {
      const apiError = toApiError(err);
      const serverDown = apiError.isNetwork || (apiError.status ?? 0) >= 500;
      setError(
        apiError.status === 409
          ? { message: 'Ese correo ya tiene una cuenta.', suggestLogin: true }
          : serverDown
            ? { message: 'No pudimos confirmar el registro porque el servidor no respondió. Puede que la cuenta ya se haya creado: prueba a iniciar sesión. Si no, vuelve a intentarlo en unos minutos.', suggestLogin: true }
            : { message: apiError.message, suggestLogin: false },
      );
      setSaving(false);
    }
  };

  return (
    <AuthLayout title="Tu nivel inicial" subtitle="Desliza hasta el nivel que más se parece a ti." backTo={paths.registerAbout} progress={<OnboardingProgress step={3} />}>
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-line bg-surface p-5 text-center" aria-live="polite">
          <p className="text-xs font-bold tracking-[0.15em] text-muted">TU NIVEL</p>
          <p className="mt-1 text-3xl font-extrabold">{selected.label}</p>
          <p className="mt-1 text-[15px] text-muted">{selected.hint}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={sliderId} className="sr-only">
            Nivel inicial
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={INITIAL_LEVELS.length - 1}
            step={1}
            value={levelIndex}
            disabled={saving}
            aria-valuetext={selected.label}
            onChange={(event) => changeLevel(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-brand"
          />
          <div className="flex justify-between text-[13px] text-muted">
            <span>{INITIAL_LEVELS[0].label}</span>
            <span className="font-bold text-white">{selected.label}</span>
            <span>{INITIAL_LEVELS[INITIAL_LEVELS.length - 1].label}</span>
          </div>
        </div>

        {canDeclareFederation && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <label htmlFor={federationId} className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block text-[15px] font-bold">¿Eres jugador federado (FDPTM)?</span>
                <span className="block text-[13px] text-muted">Activa esta opción si figuras en el ranking nacional.</span>
              </span>
              <input id={federationId} type="checkbox" role="switch" checked={federated} disabled={saving} onChange={(event) => setFederated(event.target.checked)} className="size-5 shrink-0 accent-brand" />
            </label>
            {federated && (
              <div className="border-t border-line pt-3" aria-live="polite">
                <p className="text-[15px] font-bold">Categoría FDPTM</p>
                {category ? (
                  <>
                    <p className="mt-1 text-xl font-extrabold text-gold">{category}</p>
                    <p className="text-[13px] text-muted">Sugerida según tu sexo y año de nacimiento. La declaración requiere verificación.</p>
                  </>
                ) : !canSuggest ? (
                  <p className="text-[13px] text-muted">Para sugerir una categoría necesitamos el sexo (masculino o femenino) y tu fecha de nacimiento. Puedes volver a tus datos o continuar sin declarar.</p>
                ) : suggestion.error ? (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-[13px] text-muted">No pudimos obtener tu categoría. Puedes reintentar o continuar sin declarar.</p>
                    <Button variant="text" onClick={suggestion.refetch}>
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">Consultando tu categoría…</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-col items-center gap-2 text-center">
            <p className="text-[15px] text-brand">{error.message}</p>
            {error.suggestLogin && (
              <Link to={paths.login} className="text-[15px] font-bold text-accent">
                Ir a iniciar sesión
              </Link>
            )}
          </div>
        )}
        <Button loading={saving} disabled={wantsFederation && !category} onClick={submit}>
          Completar configuración
        </Button>
      </div>
    </AuthLayout>
  );
}
