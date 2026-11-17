import { ArrowLeft, Check, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/context/toast';
import { PAID_PLANS, PLAN_ART, PLAN_LABEL, planBenefits } from '@/lib/plans';
import { membershipsService } from '@/services/memberships.service';
import type { MembershipPlan, PaidPlan } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type PlansSheetProps = { open: boolean; currentPlan: MembershipPlan; onClose: () => void };

export function PlansSheet({ open, currentPlan, onClose }: PlansSheetProps) {
  const toast = useToast();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<PaidPlan | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const offer = expanded ? PAID_PLANS.find(({ plan }) => plan === selected) : undefined;
  const art = offer ? PLAN_ART[offer.plan] : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    if (loading) return;
    setSelected(null);
    setExpanded(false);
    onClose();
  };

  const pay = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const { initPoint } = await membershipsService.createPreference(selected);
      window.location.assign(initPoint);
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={close}
      onCancel={(event) => loading && event.preventDefault()}
      className="mx-auto mt-auto mb-0 flex max-h-[90vh] w-full max-w-lg flex-col gap-3 rounded-t-3xl border border-line bg-surface p-4 text-white backdrop:bg-black/70 sm:my-auto sm:rounded-3xl [&:not([open])]:hidden"
    >
      <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line sm:hidden" />
      <div className="flex items-start gap-3">
        {offer ? (
          <Button variant="text" icon={ArrowLeft} disabled={loading} onClick={() => setExpanded(false)} className="-ml-2 flex-1 justify-start">
            Ver todos los planes
          </Button>
        ) : (
          <div className="flex-1">
            <h2 id={titleId} className="text-[22px] font-extrabold">
              Elige tu plan
            </h2>
            <p className="text-[13px] text-muted">Cada comunidad o club usa 1 espacio.</p>
          </div>
        )}
        <button type="button" aria-label="Cerrar planes" disabled={loading} onClick={close} className="rounded-lg p-2 text-white transition hover:bg-white/5">
          <X aria-hidden className="size-6" />
        </button>
      </div>

      <div className="-mx-1 flex flex-col gap-2 overflow-y-auto px-1">
        {offer && art ? (
          <>
            <img src={art.image} alt="" className="aspect-[2/1] w-full rounded-2xl object-cover" style={{ backgroundColor: art.background }} />
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col items-start gap-1">
                <h2 id={titleId} className="text-[22px] font-extrabold">
                  {PLAN_LABEL[offer.plan]}
                </h2>
                {offer.recommended && <RecommendedBadge />}
              </div>
              <Price price={offer.price} />
            </div>
            <ul className="flex flex-col gap-3">
              {planBenefits(offer.plan).map(({ Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 size-4.5 shrink-0" style={{ color: art.accent }} />
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="block text-[13px] text-muted">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div role="radiogroup" aria-label="Planes" className="flex flex-col gap-2">
            {PAID_PLANS.map(({ plan, price, recommended, description }) => {
              const active = plan === selected;
              return (
                <button
                  key={plan}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={loading}
                  onClick={() => {
                    setSelected(plan);
                    setExpanded(true);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-brand bg-brand/10' : 'border-line hover:border-muted'}`}
                >
                  <span className={`flex size-5.5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-brand bg-brand' : 'border-muted'}`}>
                    {active && <Check aria-hidden className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{PLAN_LABEL[plan]}</span>
                      {recommended && <RecommendedBadge />}
                    </span>
                    <span className="block text-[13px] text-muted">{description}</span>
                  </span>
                  <Price price={price} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button disabled={!selected} loading={loading} onClick={pay}>
        Continuar al pago
      </Button>
      <p className="text-center text-[13px] text-muted">Tu plan actual es {currentPlan === 'FREEMIUM' ? 'Gratis' : PLAN_LABEL[currentPlan]}.</p>
    </dialog>
  );
}

function Price({ price }: { price: string }) {
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className="font-extrabold tabular-nums">{price}</span>
      <span className="text-[13px] text-muted">al mes</span>
    </span>
  );
}

function RecommendedBadge() {
  return <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-white">Recomendado</span>;
}
