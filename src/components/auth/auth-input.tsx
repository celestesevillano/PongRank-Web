import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
  hint?: string;
};

export function AuthInput({ label, icon: Icon, error, hint, type = 'text', className = '', ...rest }: AuthInputProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={`flex min-h-13 items-center gap-3 rounded-xl border bg-surface px-4 transition focus-within:border-accent ${error ? 'border-brand' : 'border-line'} ${className}`}
      >
        {Icon && <Icon aria-hidden className="size-5 shrink-0 text-muted" />}
        <input
          {...rest}
          id={id}
          type={isPassword && revealed ? 'text' : type}
          placeholder={rest.placeholder ?? label}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-white outline-none placeholder:text-muted"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="-mr-2 rounded-lg p-2 text-muted transition hover:text-white"
          >
            {revealed ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-brand">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
