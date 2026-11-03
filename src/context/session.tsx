import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { authService } from '@/services/auth.service';
import { setSessionExpiredHandler } from '@/services/http';
import { tokenStore } from '@/services/token-store';
import type { AuthResponse, PlayerResponse } from '@/types/api';

type SessionContextValue = {
  isAuthenticated: boolean;
  player: PlayerResponse | null;
  isLoading: boolean;
  signInWithAuthResponse: (auth: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  updateLocalPlayer: (player: PlayerResponse) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
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
      signInWithAuthResponse: async (auth) => {
        await tokenStore.save(auth.token, auth.refreshToken);
        setPlayer(auth.player);
      },
      signOut: async () => {
        await tokenStore.clear();
        setPlayer(null);
      },
      updateLocalPlayer: setPlayer,
    }),
    [player, isLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de un SessionProvider');
  return ctx;
}
