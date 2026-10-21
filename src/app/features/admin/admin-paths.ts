import { homeFor } from '../../core/auth/auth-paths';

const home = homeFor('admin');

export const AdminPaths = {
  home,
  account: `${home}/account`,
} as const;
