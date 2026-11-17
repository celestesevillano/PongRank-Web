import { BadgeCheck, Building2, FileText } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Modal } from '@/components/common/modal';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/context/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { adminService } from '@/services/admin.service';
import type { AdminFederatedReview, ClubReview, FederatedRankingEntry } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type Tab = 'clubs' | 'federated';

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') === 'federated' ? 'federated' : 'clubs') as Tab;
  const setTab = (value: Tab) => setParams({ tab: value });

  const clubs = usePaginated((p, signal) => adminService.pendingClubs(p, signal));
  const federated = usePaginated((p, signal) => adminService.federatedReviews({ ...p, status: 'PENDING' }, signal));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header>
        <h1 className="text-[34px] font-black italic">Administración</h1>
        <p className="text-sm text-[#C2C4CA]">Revisa las solicitudes de clubes y jugadores federados</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setTab('clubs')} className="rounded-2xl border border-[#24616A] bg-[#081A20] p-4 text-left">
          <Building2 className="size-5 text-[#22D3EE]" />
          <p className="mt-2 text-4xl font-black tabular-nums">{clubs.data?.totalElements ?? '—'}</p>
          <p className="text-sm text-[#C2C4CA]">Clubes pendientes</p>
        </button>
        <button type="button" onClick={() => setTab('federated')} className="rounded-2xl border border-[#927035] bg-[#161613] p-4 text-left">
          <BadgeCheck className="size-5 text-[#FFD278]" />
          <p className="mt-2 text-4xl font-black tabular-nums">{federated.data?.totalElements ?? '—'}</p>
          <p className="text-sm text-[#C2C4CA]">Federados pendientes</p>
        </button>
      </div>

      <Tabs tabs={[{ value: 'clubs', label: 'Clubes' }, { value: 'federated', label: 'Federados' }]} active={tab} onChange={setTab} />

      {tab === 'clubs' ? <ClubsTab page={clubs} /> : <FederatedTab page={federated} />}
    </div>
  );
}

function ClubsTab({ page }: { page: ReturnType<typeof usePaginated<ClubReview>> }) {
  const toast = useToast();
  const [selected, setSelected] = useState<ClubReview | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useFetch((signal) => selected ? adminService.clubReviews(selected.id, { page: 0, size: 10 }, signal) : Promise.resolve(null), [selected?.id]);

  const refresh = () => { page.refetch(); setSelected(null); };

  const approve = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await adminService.approveClub(selected.id);
      toast.show('Club aprobado', 'success');
      refresh();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
      page.refetch();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const reject = async () => {
    if (!selected || !reason.trim()) return;
    setBusy(true);
    try {
      await adminService.rejectClub(selected.id, reason.trim());
      toast.show('Club rechazado', 'success');
      setReason('');
      refresh();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
      setRejecting(false);
    }
  };

  return (
    <>
      <ScreenState {...page} onRetry={page.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="No hay clubes pendientes.">
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.content.map((club) => (
              <Card key={club.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{club.name}</p>
                  <p className="text-[13px] text-muted">{club.address} · {club.admin?.name}</p>
                </div>
                <Button onClick={() => setSelected(club)}>Revisar</Button>
              </Card>
            ))}
            <PaginationBar page={data} size={page.size} onPageChange={page.setPage} onSizeChange={page.setSize} />
          </div>
        )}
      </ScreenState>

      <Modal open={selected !== null && !confirming && !rejecting} title={selected?.name ?? ''} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-muted">{selected.address}</p>
            {selected.description && <p>{selected.description}</p>}
            <p className="text-muted">Responsable: {selected.admin?.name}</p>
            {selected.affiliationDocumentUrl
              ? <a href={selected.affiliationDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent"><FileText className="size-4" /> Ver documento</a>
              : <p className="text-muted">Sin documento</p>}
            {(history.data?.content ?? []).length > 0 && (
              <div>
                <h3 className="font-bold">Historial</h3>
                {history.data!.content.map((item) => (
                  <p key={item.id} className="text-muted">{item.result} · {item.reason ?? 'Sin motivo'} · {item.reviewer?.name}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setConfirming(true)}>Aprobar</Button>
              <Button className="flex-1" variant="secondary" onClick={() => setRejecting(true)}>Rechazar</Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={confirming} title="¿Aprobar el club?" message="Aparecerá en la búsqueda y dejará unirse." confirmLabel="Aprobar" loading={busy} onCancel={() => setConfirming(false)} onConfirm={approve} />
      <Modal open={rejecting} title="Motivo del rechazo" onClose={() => setRejecting(false)}>
        <ReasonField value={reason} onChange={setReason} />
        <Button loading={busy} disabled={!reason.trim() || reason.length > 500} onClick={reject}>Rechazar</Button>
      </Modal>
    </>
  );
}

function FederatedTab({ page }: { page: ReturnType<typeof usePaginated<AdminFederatedReview>> }) {
  const toast = useToast();
  const [selected, setSelected] = useState<AdminFederatedReview | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query);
  const [entry, setEntry] = useState<FederatedRankingEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const ranking = useFetch((signal) => selected && debounced.length >= 2
    ? adminService.federatedRanking({ category: selected.review.category, name: debounced, page: 0, size: 10 }, signal)
    : Promise.resolve(null), [selected?.review.playerId, debounced]);

  const refresh = () => { page.refetch(); setSelected(null); setEntry(null); setQuery(''); };

  const verify = async () => {
    if (!selected || !entry) return;
    setBusy(true);
    try {
      await adminService.verifyFederated(selected.review.playerId, entry.id);
      toast.show('Jugador verificado', 'success');
      refresh();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!selected || !reason.trim()) return;
    setBusy(true);
    try {
      await adminService.rejectFederated(selected.review.playerId, reason.trim());
      toast.show('Solicitud rechazada', 'success');
      setReason('');
      refresh();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
      setRejecting(false);
    }
  };

  return (
    <>
      <ScreenState {...page} onRetry={page.refetch} isEmpty={(data) => data.content.length === 0} emptyMessage="No hay federados pendientes.">
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.content.map((item) => (
              <Card key={item.review.playerId} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.playerName}</p>
                  <p className="text-[13px] text-muted">Categoría {item.review.category}</p>
                </div>
                <Button onClick={() => setSelected(item)}>Revisar</Button>
              </Card>
            ))}
            <PaginationBar page={data} size={page.size} onPageChange={page.setPage} onSizeChange={page.setSize} />
          </div>
        )}
      </ScreenState>

      <Modal open={selected !== null && !rejecting} title={selected?.playerName ?? ''} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Categoría {selected.review.category}</p>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en el ranking oficial" className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" />
            <div className="flex max-h-48 flex-col gap-2 overflow-auto">
              {(ranking.data?.content ?? []).map((row) => (
                <button key={row.id} type="button" onClick={() => setEntry(row)} className={`rounded-xl border px-3 py-2 text-left text-sm ${entry?.id === row.id ? 'border-accent' : 'border-line'}`}>
                  <span className="font-bold">{row.name}</span>
                  <span className="text-muted"> · {row.club} · #{row.rankingPosition}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" loading={busy} disabled={!entry} onClick={verify}>Verificar</Button>
              <Button className="flex-1" variant="secondary" onClick={() => setRejecting(true)}>Rechazar</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={rejecting} title="Motivo del rechazo" onClose={() => setRejecting(false)}>
        <ReasonField value={reason} onChange={setReason} />
        <Button loading={busy} disabled={!reason.trim() || reason.length > 500} onClick={reject}>Rechazar</Button>
      </Modal>
    </>
  );
}

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const invalid = value.length > 500 || !value.trim();
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      Motivo
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} maxLength={500} className="rounded-xl border border-line bg-black px-3 py-2 outline-none focus:border-accent" />
      <span className={`text-xs ${invalid ? 'text-brand' : 'text-muted'}`}>{value.length}/500{!value.trim() && ' · Obligatorio'}</span>
    </label>
  );
}
