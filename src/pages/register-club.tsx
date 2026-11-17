import { ChevronLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { clubsService } from '@/services/clubs.service';
import { toApiError } from '@/utils/api-error';

export default function RegisterClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 3 || address.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      await clubsService.register({ name: name.trim(), address: address.trim(), description: description.trim() || undefined, affiliationDocumentUrl: 'https://pong-rank-web.vercel.app' });
      navigate('/social');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Registrar club</h1>
      <img src="/illustrations/pongrank-clubes-social-equipo.webp" alt="" className="h-28 w-full rounded-2xl object-cover" />
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">Nombre<input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" /></label>
        <label className="flex flex-col gap-1 text-sm font-semibold">Dirección<input value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3 outline-none focus:border-accent" /></label>
        <label className="flex flex-col gap-1 text-sm font-semibold">Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl border border-line bg-black px-3 py-2 outline-none focus:border-accent" /></label>
        {error && <p className="text-sm text-brand">{error}</p>}
        <Button type="submit" loading={loading} disabled={name.trim().length < 3 || address.trim().length < 3}>Enviar registro</Button>
      </form>
      <p className="text-xs text-muted">El club nace en revisión. Un administrador lo aprueba y después aparece en la búsqueda.</p>
    </div>
  );
}
