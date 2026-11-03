import { INITIAL_LEVELS, type InitialLevel } from '@/utils/levels';

type LevelPickerProps = { value: InitialLevel; onChange: (level: InitialLevel) => void };

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold text-muted">Tu nivel inicial</legend>
      {INITIAL_LEVELS.map((level) => {
        const selected = level.value === value;
        return (
          <label
            key={level.value}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${selected ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}
          >
            <span>
              <span className="block font-bold">{level.label}</span>
              <span className="block text-xs text-muted">{level.hint}</span>
            </span>
            <span className="text-sm font-bold text-brand">{level.rating}</span>
            <input type="radio" name="initial-level" value={level.value} checked={selected} onChange={() => onChange(level.value)} className="sr-only" />
          </label>
        );
      })}
    </fieldset>
  );
}
