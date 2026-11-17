const TOTAL_STEPS = 4;

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label={`Paso ${step} de ${TOTAL_STEPS}`}>
      <p className="text-center text-xs text-muted">
        Paso {step} de {TOTAL_STEPS}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span key={index} className={`h-[3px] flex-1 rounded-full transition-colors ${index < step ? 'bg-brand' : 'bg-line'}`} />
        ))}
      </div>
    </div>
  );
}
