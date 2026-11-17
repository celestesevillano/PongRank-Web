import { CircleCheck, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validatePassword } from '@/utils/validation';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmation: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [done, setDone] = useState(false);

  const passwordError = validatePassword(password);
  const confirmationError = confirmation !== password ? 'Las contraseñas no coinciden.' : null;
  const canSubmit = !passwordError && !confirmationError;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ password: true, confirmation: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.status === 401 || apiError.status === 400) setLinkExpired(true);
      else setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || linkExpired) {
    return (
      <AuthLayout
        title={token ? 'Este enlace ya no sirve' : 'Falta el enlace'}
        subtitle={token ? 'El enlace venció o ya se usó. Pide uno nuevo y úsalo en los próximos minutos.' : 'Abre el enlace que te enviamos por correo para crear tu nueva contraseña.'}
        backTo={paths.login}
      >
        <ButtonLink to={paths.forgotPassword}>Pedir un enlace nuevo</ButtonLink>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="¡Contraseña actualizada!">
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <CircleCheck aria-hidden className="size-14 text-success" />
          <p className="text-[15px] text-muted">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <ButtonLink to={paths.login} replace className="w-full">
            Iniciar sesión
          </ButtonLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea una contraseña nueva" subtitle="Elige una que no hayas usado antes." backTo={paths.login}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput
          label="Nueva contraseña"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          error={touched.password ? passwordError : null}
          hint="Mínimo 8 caracteres, una letra y un número."
        />
        <AuthInput
          label="Repite la contraseña"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmation: true }))}
          error={touched.confirmation && confirmation ? confirmationError : null}
        />
        {error && (
          <p role="alert" className="text-center text-[15px] text-brand">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
