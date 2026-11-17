import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { PlansSheet } from '@/components/plans/plans-sheet';
import { useFetch } from '@/hooks/use-fetch';
import { membershipsService } from '@/services/memberships.service';
import type { MyPlanResponse } from '@/types/api';

type PlanContextValue = {
  plan: MyPlanResponse | null;
  refresh: () => void;
  openPlans: () => void;
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: PropsWithChildren) {
  const [plansOpen, setPlansOpen] = useState(false);
  const { data: plan, refetch: refresh } = useFetch((signal) => membershipsService.me(signal), []);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const value = useMemo<PlanContextValue>(() => ({ plan, refresh, openPlans: () => setPlansOpen(true) }), [plan, refresh]);

  return (
    <PlanContext.Provider value={value}>
      {children}
      <PlansSheet open={plansOpen} currentPlan={plan?.plan ?? 'FREEMIUM'} onClose={() => setPlansOpen(false)} />
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan debe usarse dentro de PlanProvider');
  return ctx;
}
