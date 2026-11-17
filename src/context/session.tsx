import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { authService } from '@/services/auth.service';
import { setSessionExpiredHandler } from '@/services/http';
import { tokenStore } from '@/services/token-store';
import type { AuthResponse, PlayerResponse } from '@/types/api';

type SessionContextValue = {
  isAuthenticated: boolean;
  player: PlayerResponse | null;
  isLoading: boolean;
  onboardingPending: boolean;
  signInWithAuthResponse: (auth: AuthResponse, options?: { onboarding?: boolean }) => Promise<void>;
  completeOnboarding: () => void;
  signOut: () => Promise<void>;
  updateLocalPlayer: (player: PlayerResponse) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await tokenStore.load();
        if (storedToken) setPlayer(await authService.me());
      } catch {
        await tokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setPlayer(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      isAuthenticated: player !== null,
      player,
      isLoading,
      onboardingPending,
      signInWithAuthResponse: async (auth, options) => {
        await tokenStore.save(auth.token, auth.refreshToken);
        setOnboardingPending(options?.onboarding ?? false);
        setPlayer(auth.player);
      },
      completeOnboarding: () => setOnboardingPending(false),
      signOut: async () => {
        await tokenStore.clear();
        setOnboardingPending(false);
        setPlayer(null);
      },
      updateLocalPlayer: setPlayer,
    }),
    [player, isLoading, onboardingPending],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de un SessionProvider');
  return ctx;
}
