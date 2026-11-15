type Choice<T extends string> = { value: T; label: string; hint?: string };

type ChoiceGroupProps<T extends string> = {
  legend: string;
  name: string;
  options: Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 2 | 3;
};

export function ChoiceGroup<T extends string>({ legend, name, options, value, onChange, columns = 3 }: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold text-muted">{legend}</legend>
      <div className={`grid gap-2 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2.5 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${selected ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}
            >
              <span className="text-sm font-bold">{option.label}</span>
              {option.hint && <span className="text-xs text-muted">{option.hint}</span>}
              <input type="radio" name={name} className="sr-only" checked={selected} onChange={() => onChange(option.value)} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
