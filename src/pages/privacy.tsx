import { ChevronLeft, LockKeyhole, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ScreenState } from '@/components/common/screen-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFetch } from '@/hooks/use-fetch';
import { friendshipsService, type PongmigosVisibility } from '@/services/friendships.service';

export default function PrivacyPage() {
  const visibility = useFetch((signal) => friendshipsService.getVisibility(signal), []);
  const [saving, setSaving] = useState<PongmigosVisibility | null>(null);
  const [error, setError] = useState('');

  async function choose(choice: PongmigosVisibility) {
    setSaving(choice);
    setError('');
    try {
      await friendshipsService.updateVisibility(choice);
      visibility.refetch();
    } catch {
      setError('No pudimos guardar la visibilidad. Intenta de nuevo.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/profile/settings" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-3xl font-extrabold">Privacidad</h1>
      <ScreenState {...visibility} onRetry={visibility.refetch}>
        {(data) => (
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Visibilidad de la lista de Pongmigos</h2>
              <p className="mt-1 text-sm text-muted">
                {data.visibility === 'ONLY_ME' ? 'Solo tú puedes ver los nombres de tu lista.' : 'Otros jugadores pueden abrir tu lista desde tu perfil.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button icon={Users} variant={data.visibility === 'EVERYONE' ? 'primary' : 'secondary'} loading={saving === 'EVERYONE'} disabled={saving !== null} onClick={() => choose('EVERYONE')}>Todos</Button>
              <Button icon={LockKeyhole} variant={data.visibility === 'ONLY_ME' ? 'primary' : 'secondary'} loading={saving === 'ONLY_ME'} disabled={saving !== null} onClick={() => choose('ONLY_ME')}>Solo yo</Button>
            </div>
            {error && <p role="alert" className="text-sm text-brand">{error}</p>}
          </Card>
        )}
      </ScreenState>
    </div>
  );
}
