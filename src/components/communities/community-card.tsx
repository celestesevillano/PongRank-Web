import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CommunityResponse } from '@/types/api';

const TYPE_LABELS: Record<CommunityResponse['communityType'], string> = {
  UNIVERSITY: 'Universidad',
  SCHOOL: 'Colegio',
  PUBLIC_PARK: 'Parque público',
  OTHER: 'Otra',
};

type CommunityCardProps = {
  community: CommunityResponse;
  isMember: boolean;
  busy: boolean;
  onJoin: (community: CommunityResponse) => void;
  onLeave: (community: CommunityResponse) => void;
};

export function CommunityCard({ community, isMember, busy, onJoin, onLeave }: CommunityCardProps) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="truncate font-bold">{community.name}</h3>
        <p className="text-xs text-muted">
          {TYPE_LABELS[community.communityType]} · {community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'}
        </p>
        {community.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{community.description}</p>}
      </div>
      {isMember ? (
        <Button variant="secondary" disabled={busy} onClick={() => onLeave(community)}>
          Salir
        </Button>
      ) : (
        <Button loading={busy} onClick={() => onJoin(community)}>
          Unirme
        </Button>
      )}
    </Card>
  );
}
