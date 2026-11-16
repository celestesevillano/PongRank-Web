import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { buttonClasses, type ButtonVariant } from '@/components/ui/button-styles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; icon?: LucideIcon };

export function Button({ variant = 'primary', loading = false, icon: Icon, disabled, className = '', children, ...rest }: ButtonProps) {
  const LeadingIcon = loading ? LoaderCircle : Icon;
  return (
    <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, className)}>
      {LeadingIcon && <LeadingIcon aria-hidden className={`size-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />}
      {children}
    </button>
  );
}
