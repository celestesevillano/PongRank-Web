import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { LevelPicker } from '@/components/ui/level-picker';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import type { InitialLevel } from '@/utils/levels';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

type Field = 'name' | 'email' | 'password';

const VALIDATORS: Record<Field, (value: string) => string | null> = {
  name: validateName,
  email: validateEmail,
  password: validatePassword,
};

export default function RegisterPage() {
  const { signInWithAuthResponse } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, password: false });
  const [level, setLevel] = useState<InitialLevel>('INTERMEDIATE');
  const [submitting, setSubmitting] = useState(false);

  const errorFor = (field: Field) => (touched[field] ? VALIDATORS[field](values[field]) : null);

  const bind = (field: Field) => ({
    value: values[field],
    error: errorFor(field),
    onChange: (event: { target: { value: string } }) => setValues((current) => ({ ...current, [field]: event.target.value })),
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if ((Object.keys(VALIDATORS) as Field[]).some((field) => VALIDATORS[field](values[field]))) return;

    setSubmitting(true);
    try {
      const auth = await authService.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        initialLevel: level,
      });
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
        <TextField label="Nombre" autoComplete="name" {...bind('name')} />
        <TextField label="Correo" type="email" autoComplete="email" {...bind('email')} />
        <TextField label="Contraseña" type="password" autoComplete="new-password" {...bind('password')} />
        <LevelPicker value={level} onChange={setLevel} />
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
