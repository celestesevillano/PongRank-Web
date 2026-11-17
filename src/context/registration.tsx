import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';

import type { Gender } from '@/types/api';

export type RegistrationDraft = {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
  gender?: Gender;
};

type RegistrationContextValue = {
  draft: RegistrationDraft | null;
  saveDraft: (patch: Partial<RegistrationDraft>) => void;
  clearDraft: () => void;
};

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export function RegistrationProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);

  const value = useMemo<RegistrationContextValue>(
    () => ({
      draft,
      saveDraft: (patch) => setDraft((prev) => ({ name: '', email: '', password: '', ...prev, ...patch })),
      clearDraft: () => setDraft(null),
    }),
    [draft],
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <Outlet />
    </RegistrationProvider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration debe usarse dentro de un RegistrationProvider');
  return ctx;
}
