import { useEffect, useRef, useState } from 'react';

import { CommunityCard } from '@/components/communities/community-card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService } from '@/services/communities.service';
import type { CommunityResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

export default function CommunitiesPage() {
  const { player } = useSession();
  const toast = useToast();
  const mine = useFetch((signal) => communitiesService.mine(signal), []);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<CommunityResponse | null>(null);

  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const debouncedQuery = useDebounce(query.trim());

  const communities = usePaginated(
    (params, signal) => communitiesService.search({ ...params, name: debouncedQuery || undefined }, signal),
    [debouncedQuery],
  );

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    communities.update({ q: debouncedQuery || null, page: '0' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const memberIds = new Set((mine.data ?? []).map((community) => community.id));

  const runMembershipChange = async (community: CommunityResponse, action: () => Promise<unknown>, successMessage: string) => {
    setPendingId(community.id);
    try {
      await action();
      toast.show(successMessage, 'success');
      mine.refetch();
      communities.refetch();
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setPendingId(null);
      setLeaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Comunidades</h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="community-search" className="text-sm font-semibold text-muted">
          Buscar comunidad
        </label>
        <input
          id="community-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre de la comunidad"
          className="rounded-xl border border-line bg-black px-3 py-2.5 outline-none focus:border-brand"
        />
      </div>

      <ScreenState
        {...communities}
        onRetry={communities.refetch}
        isEmpty={(data) => data.content.length === 0}
        emptyMessage={debouncedQuery ? `No encontramos comunidades que coincidan con "${debouncedQuery}".` : 'Todavía no hay comunidades creadas.'}
      >
        {(page) => (
          <>
            <div className="flex flex-col gap-3">
              {page.content.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isMember={memberIds.has(community.id)}
                  busy={pendingId === community.id}
                  onJoin={(target) => runMembershipChange(target, () => communitiesService.join(target.id), `Te uniste a ${target.name}.`)}
                  onLeave={setLeaving}
                />
              ))}
            </div>
            <PaginationBar page={page} size={communities.size} onPageChange={communities.setPage} onSizeChange={communities.setSize} />
          </>
        )}
      </ScreenState>

      <ConfirmDialog
        open={leaving !== null}
        title="¿Salir de la comunidad?"
        message={`Dejarás de aparecer en el ranking de ${leaving?.name ?? 'esta comunidad'}. Puedes volver a unirte cuando quieras.`}
        confirmLabel="Salir"
        loading={leaving !== null && pendingId === leaving.id}
        onCancel={() => setLeaving(null)}
        onConfirm={() => leaving && runMembershipChange(leaving, () => communitiesService.leave(leaving.id, player!.id), `Saliste de ${leaving.name}.`)}
      />
    </div>
  );
}
