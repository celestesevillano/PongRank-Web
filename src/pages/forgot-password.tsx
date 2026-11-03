import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const error = touched ? validateEmail(email) : null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;

    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para crear una nueva.">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl border border-emerald-500 p-4 text-emerald-300">
            Si el correo está registrado, recibirás las instrucciones en unos minutos.
          </p>
          <Link to="/login" className="text-center text-sm font-bold text-brand">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label="Correo"
            type="email"
            autoComplete="email"
            value={email}
            error={error}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          <Button type="submit" loading={submitting}>
            Enviar enlace
          </Button>
          <Link to="/login" className="text-center text-sm font-bold text-brand">
            Volver a iniciar sesión
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
