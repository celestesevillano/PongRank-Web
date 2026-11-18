import { Check, ChevronLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { tournamentsService, type TournamentFormat } from '@/services/tournaments.service';
import { toApiError } from '@/utils/api-error';

const FORMATS: TournamentFormat[] = ['BO3', 'BO5', 'BO7'];
const TITLES = ['Crear torneo', 'Seleccionar participantes', 'Revisar y publicar'];

export default function CreateTournamentPage() {
  const { id } = useParams();
  const clubId = Number(id);
  const navigate = useNavigate();
  const members = useFetch((signal) => clubsService.members(clubId, signal), [clubId]);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('BO3');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const keyRef = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const list = (members.data ?? []).filter((m) => m.player);
  const toggle = (playerId: number) => setSelected((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]);

  const validCount = selected.length >= 4 && selected.length % 4 === 0 && selected.length <= 64;
  const publish = async () => {
    if (!validCount) { setNotice('Elige 4 participantes o un múltiplo de 4 (máximo 64).'); return; }
    setBusy(true);
    try {
      const tournament = await tournamentsService.publish({
        clubId,
        name: name.trim(),
        matchFormat: format,
        scheduledAt: new Date(date || Date.now()).toISOString(),
        playerIds: selected,
        publicationKey: keyRef.current,
      });
      navigate(`/matches/tournaments/${tournament.id}`);
    } catch (err) {
      setNotice(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <button type="button" onClick={() => (step > 0 ? setStep(step - 1) : navigate(`/social/club/${clubId}`))} className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</button>
      <p className="text-sm text-muted">Paso {step + 1} de 3</p>
      <h1 className="text-2xl font-extrabold">{TITLES[step]}</h1>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del torneo" className="min-h-11 rounded-xl border border-line bg-black px-3" />
          <div className="flex gap-2">
            {FORMATS.map((item) => (
              <button key={item} type="button" onClick={() => setFormat(item)} className={`min-h-11 flex-1 rounded-full border font-bold ${format === item ? 'border-primary bg-primary text-white' : 'border-line'}`}>{item}</button>
            ))}
          </div>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 rounded-xl border border-line bg-black px-3" />
          <Button disabled={!name.trim()} onClick={() => setStep(1)}>Continuar</Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          {list.map((member) => {
            const checked = selected.includes(member.player!.id);
            return (
              <button key={member.id} type="button" onClick={() => toggle(member.player!.id)} className={`flex items-center justify-between rounded-2xl border p-3 text-left ${checked ? 'border-accent' : 'border-line'}`}>
                <span className="font-bold">{member.player!.name}</span>
                {checked && <Check className="size-5 text-accent" />}
              </button>
            );
          })}
          <Button disabled={!validCount} onClick={() => setStep(2)}>Revisar ({selected.length}, múltiplo de 4)</Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <Card>
            <p className="font-bold">{name}</p>
            <p className="text-sm text-muted">{format} · {selected.length} participantes</p>
          </Card>
          {list.filter((m) => selected.includes(m.player!.id)).map((m) => <Card key={m.id}><p className="font-bold">{m.player!.name}</p></Card>)}
          <Button loading={busy} onClick={publish}>Publicar torneo</Button>
        </div>
      )}

      {notice && <p className="text-sm text-muted">{notice}</p>}
      <Link to={`/social/club/${clubId}`} className="text-sm font-bold text-muted">Volver al club</Link>
    </div>
  );
}
