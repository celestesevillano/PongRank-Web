import { useId } from 'react';

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-xl border border-line bg-black px-3 py-2 text-white outline-none focus:border-brand"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
