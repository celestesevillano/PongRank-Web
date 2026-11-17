import { CalendarDays } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { OnboardingProgress } from '@/components/auth/onboarding-progress';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { useRegistration } from '@/context/registration';
import { paths } from '@/routes/paths';
import type { Gender } from '@/types/api';
import { ageFromDate, MONTHS, toIsoDate, validateBirthDate } from '@/utils/validation';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decirlo' },
];

const MIN_AGE = 5;
const LAST_YEAR = new Date().getFullYear() - MIN_AGE;
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const YEARS = Array.from({ length: LAST_YEAR - 1929 }, (_, index) => LAST_YEAR - index);

const parseIso = (iso?: string) => {
  if (!iso) return { day: null, month: null, year: null };
  const [year, month, day] = iso.split('-').map(Number);
  return { day, month, year };
};

export default function RegisterAboutPage() {
  const { draft, saveDraft } = useRegistration();
  const navigate = useNavigate();
  const initial = parseIso(draft?.birthDate);
  const [day, setDay] = useState<number | null>(initial.day);
  const [month, setMonth] = useState<number | null>(initial.month);
  const [year, setYear] = useState<number | null>(initial.year);
  const [gender, setGender] = useState<Gender | null>(draft?.gender ?? null);
  const [submitted, setSubmitted] = useState(false);

  if (!draft) return <Navigate to={paths.register} replace />;

  const dateError = validateBirthDate(day, month, year);
  const age = !dateError && day && month && year ? ageFromDate(day, month, year) : null;
  const canSubmit = !dateError && gender !== null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!canSubmit || !day || !month || !year || !gender) return;
    saveDraft({ birthDate: toIsoDate(day, month, year), gender });
    navigate(paths.registerLevel);
  };

  return (
    <AuthLayout
      title="Cuéntanos sobre ti"
      subtitle="Los usamos para armar rankings y categorías justas. Puedes cambiarlos luego en tu perfil."
      backTo={paths.register}
      progress={<OnboardingProgress step={2} />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[15px] font-bold">Fecha de nacimiento</legend>
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
            <DateSelect label="Día" value={day} options={DAYS.map((value) => ({ value, label: String(value) }))} onChange={setDay} />
            <DateSelect label="Mes" value={month} options={MONTHS.map((label, index) => ({ value: index + 1, label }))} onChange={setMonth} />
            <DateSelect label="Año" value={year} options={YEARS.map((value) => ({ value, label: String(value) }))} onChange={setYear} />
          </div>
          {age !== null ? (
            <p className="flex items-center gap-1.5 text-[13px] text-muted">
              <CalendarDays aria-hidden className="size-4" /> Tienes {age} años
            </p>
          ) : (
            submitted && dateError && <p className="text-[13px] text-brand">{dateError}</p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[15px] font-bold">
            Sexo <span className="text-brand">*</span> <span className="text-[13px] font-normal text-muted">· obligatorio</span>
          </legend>
          <ChipGroup label="Sexo" value={gender ?? ('' as Gender)} options={GENDER_OPTIONS} onChange={setGender} />
          {submitted && gender === null && <p className="text-[13px] text-brand">Elige una opción.</p>}
        </fieldset>

        <Button type="submit" disabled={!canSubmit}>
          Continuar
        </Button>
        <p className="text-center text-[13px] text-muted">Tus datos solo se usan para clasificarte. No se muestran a otros jugadores.</p>
      </form>
    </AuthLayout>
  );
}

type DateSelectProps = { label: string; value: number | null; options: { value: number; label: string }[]; onChange: (value: number) => void };

function DateSelect({ label, value, options, onChange }: DateSelectProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 rounded-xl border border-line bg-surface px-3 text-white outline-none focus:border-accent"
      >
        <option value="" disabled>
          {label}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
