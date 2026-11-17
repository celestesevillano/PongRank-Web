import { MailCheck, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { paths } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailError = validateEmail(email);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (emailError) return;
    setError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" backTo={paths.login}>
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface">
            <MailCheck aria-hidden className="size-7 text-accent" />
          </span>
          <p className="text-[15px] text-muted">
            Si <strong className="text-white">{sentTo}</strong> tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Puede tardar unos minutos y llegar a spam.
          </p>
          <ButtonLink to={paths.login} className="w-full">
            Volver a iniciar sesión
          </ButtonLink>
          <button type="button" onClick={() => setSentTo(null)} className="text-[15px] font-bold text-accent">
            Usar otro correo
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Recupera tu contraseña" subtitle="Te enviaremos un enlace a tu correo." backTo={paths.login}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput
          label="Correo"
          icon={Mail}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && email ? emailError : null}
        />
        {error && (
          <p role="alert" className="text-center text-[15px] text-brand">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting} disabled={emailError !== null}>
          Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  );
}
