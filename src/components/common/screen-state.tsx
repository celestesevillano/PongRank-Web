import type { ReactNode } from 'react';

import { Spinner } from '@/components/common/spinner';
import { Button } from '@/components/ui/button';
import { isRetryable, type ApiError } from '@/utils/api-error';

type ScreenStateProps<T> = {
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  onRetry: () => void;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  emptyImage?: string;
  emptyAction?: ReactNode;
  children: (data: T) => ReactNode;
};

export function ScreenState<T>({ loading, error, data, onRetry, isEmpty, emptyMessage = 'Aún no hay nada por aquí.', emptyImage, emptyAction, children }: ScreenStateProps<T>) {
  if (loading && data === null) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted">{error.message}</p>
        {isRetryable(error) && (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (data === null) return null;
  if (isEmpty?.(data)) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        {emptyImage && <img src={emptyImage} alt="" className="w-48 max-w-full" loading="lazy" />}
        <p className="text-muted">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return <>{children(data)}</>;
}
