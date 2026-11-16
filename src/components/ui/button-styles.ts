export type ButtonVariant = 'primary' | 'secondary' | 'text';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-white hover:bg-brand active:bg-brand-dark disabled:border-line disabled:bg-graphite disabled:text-faint',
  secondary: 'border-muted bg-transparent text-white hover:bg-white/5 active:bg-white/10 disabled:border-line disabled:bg-graphite disabled:text-faint',
  text: 'border-transparent px-2 text-accent hover:text-accent/80 disabled:text-faint',
};

export const buttonClasses = (variant: ButtonVariant, className = '') =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-bold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`;
