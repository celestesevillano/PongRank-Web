import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { playersService } from '@/services/players.service';
import { toApiError } from '@/utils/api-error';
import { validateName } from '@/utils/validation';

export default function ProfilePage() {
  const { player, updateLocalPlayer } = useSession();
  const toast = useToast();
  const [name, setName] = useState(player!.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateName(name);
    setError(validation);
    if (validation) return;

    setSaving(true);
    try {
      updateLocalPlayer(await playersService.update(player!.id, { name: name.trim() }));
      toast.show('Perfil actualizado.', 'success');
    } catch (err) {
      toast.show(toApiError(err).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Perfil</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Rating" value={Math.round(player!.ratingGlicko)} />
        <StatCard label="Categoría FDPTM" value={player!.categoryFdptm ?? 'Sin categoría'} />
      </div>
      <Card>
        <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4" noValidate>
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <TextField label="Correo" value={player!.email} disabled readOnly />
          <Button type="submit" loading={saving}>
            Guardar cambios
          </Button>
        </form>
      </Card>
    </div>
  );
}
