import { useSearchParams } from 'react-router-dom';

import { useFetch } from '@/hooks/use-fetch';
import type { Page } from '@/types/api';

export const PAGE_SIZES = [10, 25, 50, 100] as const;

const toInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

export function usePaginated<T>(
  fetchPage: (params: { page: number; size: number }, signal: AbortSignal) => Promise<Page<T>>,
  deps: unknown[] = [],
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = toInt(searchParams.get('page'), 0);
  const requestedSize = toInt(searchParams.get('size'), PAGE_SIZES[0]);
  const size = (PAGE_SIZES as readonly number[]).includes(requestedSize) ? requestedSize : PAGE_SIZES[0];

  const update = (changes: Record<string, string | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value === null ? next.delete(key) : next.set(key, value)));
        return next;
      },
      { replace: true },
    );

  const { data, error, loading, refetch } = useFetch((signal) => fetchPage({ page, size }, signal), [page, size, ...deps]);

  return {
    data,
    error,
    loading,
    refetch,
    page,
    size,
    setPage: (next: number) => update({ page: String(next) }),
    setSize: (next: number) => update({ size: String(next), page: '0' }),
    update,
  };
}
