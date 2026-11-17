import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Link to="/profile/settings" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-white"><ChevronLeft className="size-4" /> Volver</Link>
      <h1 className="text-2xl font-extrabold">Privacidad</h1>
      <Card className="flex flex-col gap-2 text-sm text-muted">
        <p>Tu perfil público muestra tu nombre, rating y categoría.</p>
        <p>Tus Pongmigos pueden ver tu número de WhatsApp solo si lo activas en Ajustes.</p>
        <p>Las partidas confirmadas quedan en el ranking de tus comunidades.</p>
      </Card>
    </div>
  );
}
