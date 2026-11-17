import { Lock, Mail, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthInput } from '@/components/auth/auth-input';
import { OnboardingProgress } from '@/components/auth/onboarding-progress';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/context/registration';
import { paths } from '@/routes/paths';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

export default function RegisterPage() {
  const { draft, saveDraft } = useRegistration();
  const navigate = useNavigate();
  const [name, setName] = useState(draft?.name ?? '');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const errors = { name: validateName(name), email: validateEmail(email), password: validatePassword(password) };
  const canSubmit = !errors.name && !errors.email && !errors.password;
  const markTouched = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!canSubmit) return;
    saveDraft({ name: name.trim(), email: email.trim(), password });
    navigate(paths.registerAbout);
  };

  return (
    <AuthLayout title="Crea tu cuenta" backTo={paths.welcome} progress={<OnboardingProgress step={1} />}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput label="Nombre completo" icon={User} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => markTouched('name')} error={touched.name ? errors.name : null} />
        <AuthInput label="Correo" icon={Mail} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => markTouched('email')} error={touched.email ? errors.email : null} />
        <AuthInput
          label="Contraseña"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => markTouched('password')}
          error={touched.password ? errors.password : null}
          hint="Mínimo 8 caracteres, una letra y un número."
        />
        <Button type="submit" disabled={!canSubmit}>
          Continuar
        </Button>
        <p className="text-center text-[15px] text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to={paths.login} replace className="font-bold text-accent">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
