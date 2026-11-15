import { useId, useState, type FormEvent } from 'react';

import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';

const MAX_REASON = 500;

type DisputeDialogProps = {
  open: boolean;
  loading: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
};

export function DisputeDialog({ open, loading, onSubmit, onCancel }: DisputeDialogProps) {
  const fieldId = useId();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const error = trimmed.length === 0 ? 'Cuéntale a tu rival qué no coincide.' : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!error) onSubmit(trimmed);
  };

  return (
    <Modal open={open} title="Disputar resultado" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <label htmlFor={fieldId} className="text-sm text-muted">
          El resultado quedará en revisión y no contará para el ranking hasta resolverse.
        </label>
        <textarea
          id={fieldId}
          value={reason}
          maxLength={MAX_REASON}
          rows={4}
          placeholder="Ej.: el tercer set fue 11-9, no 9-11."
          aria-invalid={touched && error ? true : undefined}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          className={`resize-none rounded-xl border bg-black px-3 py-2.5 text-white outline-none focus:border-brand ${touched && error ? 'border-brand' : 'border-line'}`}
        />
        <div className="flex justify-between text-xs">
          <span className="text-red-400">{touched ? error : null}</span>
          <span className="text-muted">
            {reason.length}/{MAX_REASON}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Volver
          </Button>
          <Button type="submit" loading={loading}>
            Enviar disputa
          </Button>
        </div>
      </form>
    </Modal>
  );
}
