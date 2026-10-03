import { HttpErrorResponse } from '@angular/common/http';

/** Error body agreed with the backend: RFC 9457 Problem Details plus a stable `code`. */
export interface ProblemDetails {
  readonly status?: number;
  readonly code?: string;
  readonly title?: string;
  readonly detail?: string;
}

/** The machine-readable `code` from an API error, if the body carries one. */
export function problemCode(error: HttpErrorResponse): string | undefined {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) return undefined;
  const { code } = body as ProblemDetails;
  return typeof code === 'string' ? code : undefined;
}
