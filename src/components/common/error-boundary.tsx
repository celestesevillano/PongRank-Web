import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

type State = { hasError: boolean };

export class ErrorBoundary extends Component<PropsWithChildren<{ fallback?: ReactNode }>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      this.props.fallback ?? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-extrabold">Algo salió mal</h1>
          <p className="text-muted">Ocurrió un error inesperado en la aplicación.</p>
          <button className="rounded-xl bg-brand px-4 py-2.5 font-bold" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      )
    );
  }
}
