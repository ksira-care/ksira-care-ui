import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from './api-base-url';

/**
 * Sends the session cookie with API calls — and only API calls, so it never
 * leaks to third-party requests. Needed when the API is on a subdomain;
 * harmless when it's same-origin.
 */
export const apiCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);
  const isApiCall = req.url === apiBaseUrl || req.url.startsWith(`${apiBaseUrl}/`);
  return next(isApiCall ? req.clone({ withCredentials: true }) : req);
};
