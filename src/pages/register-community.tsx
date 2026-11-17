import { Check, Plus, Search, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthInput } from '@/components/auth/auth-input';
import { OnboardingProgress } from '@/components/auth/onboarding-progress';
import { Spinner } from '@/components/common/spinner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { paths } from '@/routes/paths';
import { communitiesService } from '@/services/communities.service';
import type { CommunityResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { COMMUNITY_TYPE_LABELS, CREATABLE_COMMUNITY_TYPES, type CommunityType } from '@/utils/community-types';

export default function RegisterCommunityPage() {
  const { completeOnboarding } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const communities = useFetch((signal) => communitiesService.search({ name: debouncedQuery || undefined, size: 20 }, signal), [debouncedQuery]);

  const finish = () => {
    completeOnboarding();
    navigate(paths.home, { replace: true });
  };

  const join = async (community: CommunityResponse) => {
    setJoiningId(community.id);
    try {
      await communitiesService.join(community.id);
      setJoinedIds((prev) => new Set(prev).add(community.id));
      toast.show(`Te uniste a ${community.name}.`, 'success');
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <AuthLayout title="Elige tu comunidad" progress={<OnboardingProgress step={4} />}>
      {creating ? (
        <CreateCommunityForm
          onCancel={() => setCreating(false)}
          onCreated={(community) => {
            toast.show(`Creaste ${community.name}. ¡Invita a tus amigos!`, 'success');
            finish();
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <AuthInput label="Buscar comunidad" icon={Search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} />

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto" aria-busy={communities.loading}>
            {communities.loading && !communities.data ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : communities.error ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <p className="text-[15px] text-muted">{communities.error.message}</p>
                <Button variant="secondary" onClick={communities.refetch}>
                  Reintentar
                </Button>
              </div>
            ) : communities.data && communities.data.content.length === 0 ? (
              <p className="py-4 text-center text-[15px] text-muted">No hay comunidades que coincidan con tu búsqueda.</p>
            ) : (
              communities.data?.content.map((community) => {
                const joined = joinedIds.has(community.id);
                return (
                  <div key={community.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{community.name}</p>
                      <p className="flex items-center gap-1 text-[13px] text-muted">
                        <Users aria-hidden className="size-3.5" /> {community.memberCount} miembros · {COMMUNITY_TYPE_LABELS[community.communityType]}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      icon={joined ? Check : undefined}
                      loading={joiningId === community.id}
                      disabled={joined || (joiningId !== null && joiningId !== community.id)}
                      onClick={() => join(community)}
                      aria-label={joined ? `Ya te uniste a ${community.name}` : `Unirme a ${community.name}`}
                    >
                      {joined ? 'Unido' : 'Unirme'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <Button variant="secondary" icon={Plus} onClick={() => setCreating(true)}>
            Crear una comunidad
          </Button>
          <p className="text-center text-[13px] text-muted">
            Puedes jugar partidas, retar a tus Pongmigos y aparecer en el ranking general sin unirte a ninguna comunidad. Unirte te da además un ranking dentro de tu grupo.
          </p>
          {joinedIds.size > 0 ? (
            <Button onClick={finish}>Ir al inicio</Button>
          ) : (
            <Button variant="text" onClick={finish}>
              Saltar por ahora
            </Button>
          )}
        </div>
      )}
    </AuthLayout>
  );
}

type CreateCommunityFormProps = { onCancel: () => void; onCreated: (community: CommunityResponse) => void };

function CreateCommunityForm({ onCancel, onCreated }: CreateCommunityFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('UNIVERSITY');
  const [customLabel, setCustomLabel] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = name.trim().length < 3 ? 'Usa al menos 3 caracteres.' : null;
  const labelError = type === 'OTHER' && !customLabel.trim() ? 'Escribe qué tipo de comunidad es.' : null;
  const canSubmit = !nameError && !labelError;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(
        await communitiesService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          communityType: type,
          customLabel: type === 'OTHER' ? customLabel.trim() : undefined,
        }),
      );
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.status === 409 ? 'Ya existe una comunidad con ese nombre.' : apiError.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <AuthInput label="Nombre de la comunidad" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} onBlur={() => setTouched(true)} error={touched ? nameError : null} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[15px] font-bold">Tipo</legend>
        <ChipGroup label="Tipo de comunidad" value={type} options={CREATABLE_COMMUNITY_TYPES.map((value) => ({ value, label: COMMUNITY_TYPE_LABELS[value] }))} onChange={setType} />
      </fieldset>
      {type === 'OTHER' && (
        <AuthInput label="¿Qué tipo de comunidad es?" placeholder="Ej.: Club del barrio" maxLength={40} value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} error={touched ? labelError : null} />
      )}
      <AuthInput label="Descripción (opcional)" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
      {error && (
        <p role="alert" className="text-center text-[15px] text-brand">
          {error}
        </p>
      )}
      <Button type="submit" loading={saving} disabled={!canSubmit}>
        Crear comunidad
      </Button>
      <Button type="button" variant="text" disabled={saving} onClick={onCancel}>
        Volver a la lista
      </Button>
    </form>
  );
}
