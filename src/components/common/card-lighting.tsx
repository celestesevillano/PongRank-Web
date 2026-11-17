import { useId } from 'react';

type CardLightingProps = { color: string; court?: boolean };

export function CardLighting({ color, court = false }: CardLightingProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 360 124" preserveAspectRatio="none" className="absolute inset-0">
        <defs>
          <radialGradient id={gradientId} cx="98%" cy="94%" r="88%" gradientTransform="translate(0.98 0.94) scale(0.84 1.16) translate(-0.98 -0.94)">
            <stop offset="0" stopColor={color} stopOpacity={court ? 0.48 : 0.33} />
            <stop offset="0.58" stopColor={color} stopOpacity={0.09} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width="360" height="124" fill={`url(#${gradientId})`} />
        {court && (
          <>
            <ellipse cx={352} cy={125} rx={85} ry={16} fill={color} opacity={0.16} />
            <path d="M235 124 L289 91 L360 75 M267 124 L360 95 M280 113 L360 90 M298 103 L298 124 M313 99 L314 124 M330 94 L331 124 M348 90 L350 124" stroke={color} strokeWidth={1} strokeOpacity={0.38} fill="none" />
            <path d="M286 92 L360 75" stroke={color} strokeWidth={3} strokeOpacity={0.85} fill="none" />
          </>
        )}
      </svg>
      <span className="absolute -top-16 right-6.5 h-65 w-7.5 rotate-[38deg] opacity-15" style={{ backgroundColor: color }} />
      <span className="absolute -top-16 right-3 h-65 w-2 rotate-[38deg] opacity-25" style={{ backgroundColor: color }} />
    </div>
  );
}
