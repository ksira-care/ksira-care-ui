import { Environment } from './environment.model';

/** Production settings. Development overrides live in environment.development.ts. */
export const environment: Environment = {
  apiBaseUrl: '/api',
};
