import { Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/session';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function LoginPage() {
  const { signInWithAuthResponse } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = validateEmail(email);
  const canSubmit = emailError === null && password.length > 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signInWithAuthResponse(await authService.login({ email: email.trim(), password }));
      navigate((location.state as { from?: string } | null)?.from ?? paths.home, { replace: true });
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.status === 401 ? 'Correo o contraseña incorrectos.' : apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Bienvenido de vuelta" backTo={paths.welcome}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput
          label="Correo"
          icon={Mail}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched && email ? emailError : null}
        />
        <AuthInput label="Contraseña" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && (
          <p role="alert" className="text-center text-[15px] text-brand">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          Iniciar sesión
        </Button>
        <Link to={paths.forgotPassword} className="self-center rounded-lg px-2 py-1 text-[15px] font-bold text-accent">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-center text-[15px] text-muted">
          ¿No tienes cuenta?{' '}
          <Link to={paths.register} replace className="font-bold text-accent">
            Crear cuenta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
