export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  ranking: '/ranking',
  matches: '/matches',
  matchDetail: (id: number | string) => `/matches/${id}`,
  profile: '/profile',
} as const;
