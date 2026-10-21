import { HttpErrorResponse } from '@angular/common/http';
import { OperatorFunction, catchError, throwError } from 'rxjs';
import { problemCode } from './problem-details';

/**
 * A failed API call as the app sees it: the server's stable `code` (e.g.
 * "CONCURRENT_UPDATE"), "NETWORK" when the server couldn't be reached, or
 * "UNKNOWN". Gateways turn transport errors into these, so pages never see HTTP.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    options?: ErrorOptions,
  ) {
    super(`API request failed: ${code}`, options);
    this.name = 'ApiError';
  }

  /** Whether `error` is an ApiError with this code. */
  static is(error: unknown, code: string): boolean {
    return error instanceof ApiError && error.code === code;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof HttpErrorResponse)) return new ApiError('UNKNOWN', { cause: error });
  if (error.status === 0) return new ApiError('NETWORK', { cause: error });
  return new ApiError(problemCode(error) ?? 'UNKNOWN', { cause: error });
}

/** Pipes any failure through {@link toApiError}. */
export function mapApiErrors<T>(): OperatorFunction<T, T> {
  return catchError((error: unknown) => throwError(() => toApiError(error)));
}
