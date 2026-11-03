export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  communities: '/communities',
  ranking: '/ranking',
  matches: '/matches',
  newMatch: '/matches/new',
  findMatch: '/matches/find',
  matchDetail: (id: number | string) => `/matches/${id}`,
  profile: '/profile',
} as const;
