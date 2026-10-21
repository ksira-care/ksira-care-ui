import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { Language } from './language.models';
import { LanguagesGateway } from './languages.gateway';

interface LanguagesResponseDto {
  readonly languages: readonly Language[];
}

@Injectable()
export class HttpLanguagesGateway extends LanguagesGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/languages`;

  /** The list hardly ever changes: kept once loaded, but a failed load can be retried. */
  private loaded: Language[] | null = null;

  override getLanguages(): Observable<Language[]> {
    if (this.loaded) return of(this.loaded);
    return this.http.get<LanguagesResponseDto>(this.url).pipe(
      map((response) => [...response.languages]),
      tap((languages) => (this.loaded = languages)),
    );
  }
}
