import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { Language } from './language.models';
import { LanguagesGateway } from './languages.gateway';

/** The backend's languages, in its order (by name). */
export const MOCK_LANGUAGES: readonly Language[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'mr', name: 'Marathi' },
];

@Injectable()
export class MockLanguagesGateway extends LanguagesGateway {
  override getLanguages(): Observable<Language[]> {
    return timer(200).pipe(map(() => [...MOCK_LANGUAGES]));
  }
}
