import { useId, useMemo, useState } from 'react';

import { Spinner } from '@/components/common/spinner';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import type { ApiError } from '@/utils/api-error';

export type OpponentOption = { id: number; name: string; ratingGlicko: number };

type OpponentPickerProps = {
  options: OpponentOption[] | null;
  loading: boolean;
  error: ApiError | null;
  selectedId: number | null;
  emptyMessage: string;
  onRetry: () => void;
  onSelect: (option: OpponentOption) => void;
};

export function OpponentPicker({ options, loading, error, selectedId, emptyMessage, onRetry, onSelect }: OpponentPickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim().toLowerCase(), 250);

  const visible = useMemo(
    () => (options ?? []).filter((option) => option.name.toLowerCase().includes(debouncedQuery)),
    [options, debouncedQuery],
  );

  if (loading && options === null) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-brand">{error.message}</p>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!options || options.length === 0) return <p className="text-sm text-muted">{emptyMessage}</p>;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={searchId} className="sr-only">
        Buscar rival por nombre
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        placeholder="Buscar por nombre"
        onChange={(event) => setQuery(event.target.value)}
        className="rounded-xl border border-line bg-black px-3 py-2.5 text-white outline-none focus:border-accent"
      />
      {visible.length === 0 ? (
        <p className="py-3 text-sm text-muted">Nadie coincide con “{query.trim()}”.</p>
      ) : (
        <ul role="listbox" aria-label="Rivales" className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {visible.map((option) => {
            const selected = option.id === selectedId;
            return (
              <li key={option.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => onSelect(option)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${selected ? 'border-brand bg-brand/15' : 'border-line hover:border-muted'}`}
                >
                  <span className="truncate font-bold">{option.name}</span>
                  <span className="shrink-0 font-bold text-accent tabular-nums">{Math.round(option.ratingGlicko)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
