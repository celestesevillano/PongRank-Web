import { useCallback, useEffect, useRef, useState } from 'react';

import { matchesService } from '@/services/matches.service';
import type { LiveMatchAction, LiveMatchState } from '@/types/api';
import { toApiError, type ApiError } from '@/utils/api-error';

const POLL_MS = 1400;

export function useLiveMatch(matchId: number, enabled: boolean, onMatchChanged: () => void) {
  const [state, setState] = useState<LiveMatchState | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const onChangedRef = useRef(onMatchChanged);

  useEffect(() => {
    onChangedRef.current = onMatchChanged;
  }, [onMatchChanged]);

  const accept = useCallback((next: LiveMatchState) => {
    setState((current) => (!current || next.revision >= current.revision ? next : current));
    if (next.status !== 'CREATED') onChangedRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      if (!document.hidden) {
        try {
          accept(await matchesService.live(matchId, controller.signal));
          setError(null);
        } catch (err) {
          if (!controller.signal.aborted) setError(toApiError(err));
        }
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, POLL_MS);
    };

    refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [enabled, matchId, accept]);

  const perform = async (action: LiveMatchAction) => {
    if (!enabled || !state || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      accept(await matchesService.updateLive(matchId, action, state.revision));
      setError(null);
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError);
      if (apiError.status === 409) accept(await matchesService.live(matchId).catch(() => state));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return { state, error, busy, perform };
}
