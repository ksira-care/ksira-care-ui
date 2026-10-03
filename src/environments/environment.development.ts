import { Environment } from './environment.model';

/**
 * Local development (`ng serve`). The portal runs on mock data here — see
 * therapist-api.providers.mock.ts and `fileReplacements` in angular.json.
 */
export const environment: Environment = {
  apiBaseUrl: '/api',
};
