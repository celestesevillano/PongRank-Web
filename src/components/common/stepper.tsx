type StepperProps = { steps: string[]; current: number };

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol aria-label="Progreso" className="flex items-center gap-2 text-xs font-semibold">
      {steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
                state === 'todo' ? 'border-line text-muted' : 'border-brand bg-brand text-white'
              }`}
            >
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span className={`truncate ${state === 'todo' ? 'text-muted' : 'text-white'}`}>{label}</span>
            {index < steps.length - 1 && <span aria-hidden className={`h-px flex-1 ${state === 'done' ? 'bg-brand' : 'bg-line'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
