import { homeFor } from '../../core/auth/auth-paths';

const home = homeFor('aapta');

export const AaptaPaths = {
  home,
  availability: `${home}/availability`,
  bookings: `${home}/bookings`,
  profile: `${home}/profile`,
} as const;
