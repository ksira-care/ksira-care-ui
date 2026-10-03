import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Root of every API call, e.g. "/api" or "https://api.ksiracare.com". No trailing slash. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
