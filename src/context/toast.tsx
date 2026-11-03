import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };

type ToastContextValue = { show: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-500 text-emerald-300',
  error: 'border-brand text-red-300',
  info: 'border-line text-white',
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg ${KIND_STYLES[toast.kind]}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de un ToastProvider');
  return ctx;
}
