import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-white backdrop:bg-black/70"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
          <X className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
