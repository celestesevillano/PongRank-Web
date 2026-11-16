import type { LucideIcon } from 'lucide-react';
import { Link, type LinkProps } from 'react-router-dom';

import { buttonClasses, type ButtonVariant } from '@/components/ui/button-styles';

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; icon?: LucideIcon };

export function ButtonLink({ variant = 'primary', icon: Icon, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link {...rest} className={buttonClasses(variant, className)}>
      {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
      {children}
    </Link>
  );
}
