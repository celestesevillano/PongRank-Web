import { Check } from 'lucide-react';

type ChipGroupProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
              selected ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-muted hover:border-muted hover:text-white'
            }`}
          >
            {selected && <Check aria-hidden className="size-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
