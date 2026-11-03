import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function LoginPage() {
  const { signInWithAuthResponse } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = { email: validateEmail(email), password: password ? null : 'Ingresa tu contraseña.' };
    setErrors(next);
    if (next.email || next.password) return;

    setSubmitting(true);
    try {
      await signInWithAuthResponse(await authService.login({ email: email.trim(), password }));
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Inicia sesión" subtitle="Vuelve a la mesa y sigue subiendo en el ranking.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Correo" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <Button type="submit" loading={submitting}>
          Entrar
        </Button>
        <p className="text-center text-sm text-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-brand">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
