import { Observable } from 'rxjs';
import { Language } from './language.models';

/** Boundary between the language pickers and the API. */
export abstract class LanguagesGateway {
  /** Every language aaptas can be matched on, by name. */
  abstract getLanguages(): Observable<Language[]>;
}
