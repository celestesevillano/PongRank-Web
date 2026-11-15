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
      className="inline-flex items-center justify-center self-start rounded-xl border border-emerald-500/50 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10"
    >
      Escribir a {opponentName} por WhatsApp
    </a>
  );
}
