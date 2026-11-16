import { siWhatsapp } from 'simple-icons';

type WhatsAppLinkProps = { phone: string; opponentName: string };

export function WhatsAppLink({ phone, opponentName }: WhatsAppLinkProps) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const text = encodeURIComponent(`¡Hola ${opponentName}! Te escribo por nuestra partida en PongRank.`);

  return (
    <a
      href={`https://wa.me/${digits}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-muted px-4 text-[15px] font-bold text-white transition hover:bg-white/5"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0" fill={`#${siWhatsapp.hex}`}>
        <path d={siWhatsapp.path} />
      </svg>
      Escribir a {opponentName} por WhatsApp
    </a>
  );
}
