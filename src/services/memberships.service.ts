import { http } from '@/services/http';
import type { MyPlanResponse, PaidPlan, PaymentPreference } from '@/types/api';

export const membershipsService = {
  me: (signal?: AbortSignal) => http.get<MyPlanResponse>('/memberships/me', { signal }).then((r) => r.data),

  createPreference: (plan: PaidPlan) => http.post<PaymentPreference>('/payments/create-preference', { plan }).then((r) => r.data),
};
