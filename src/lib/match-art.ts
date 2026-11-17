const art = (name: string) => `/illustrations/partidas/${name}.webp`;

export const MatchArt = {
  banner: art('partidas-banner'),
  idle: art('partidas-idle'),
  search: art('partidas-search'),
  location: art('partidas-location'),
  cancelled: art('partidas-cancelled'),
  rival: art('partidas-rival'),
  confirmed: art('partidas-confirmed'),
  tournaments: art('partidas-tournament'),
  versus: art('partidas-versus'),
  sent: art('partidas-waiting'),
  review: art('partidas-review'),
  send: art('partidas-send'),
  win: art('partidas-win'),
  loss: art('partidas-loss'),
  offline: art('pongi-pongmigos-sin-conexion'),
} as const;
