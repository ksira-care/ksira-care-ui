import { homeFor } from '../../core/auth/auth-paths';

const home = homeFor('admin');

export const AdminPaths = {
  /** The Today page. */
  home,
  availability: `${home}/availability`,
  aaptas: `${home}/aaptas`,
  history: `${home}/history`,
  account: `${home}/account`,
} as const;
