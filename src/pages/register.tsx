import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

const DEFAULT_RATING = 1500;

export default function RegisterPage() {
  const { signInWithAuthResponse } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [errors, setErrors] = useState<{ name?: string | null; email?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = { name: validateName(name), email: validateEmail(email), password: validatePassword(password) };
    setErrors(next);
    if (next.name || next.email || next.password) return;

    setSubmitting(true);
    try {
      const auth = await authService.register({ name: name.trim(), email: email.trim(), password, initialRating: rating });
      await signInWithAuthResponse(auth);
      toast.show('Cuenta creada. ¡Bienvenido a PongRank!', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Elige tu nivel inicial; luego el ranking lo ajusta con tus partidas.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Nombre" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField label="Correo" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rating" className="text-sm font-semibold text-muted">
            Rating inicial: <span className="text-white">{rating}</span>
          </label>
          <input id="rating" type="range" min={0} max={2800} step={50} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="accent-brand" />
        </div>
        <Button type="submit" loading={submitting}>
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-brand">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
