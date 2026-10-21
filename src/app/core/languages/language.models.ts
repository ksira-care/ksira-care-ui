/** A language aaptas can speak, e.g. `{ code: 'hi', name: 'Hindi' }`. */
export interface Language {
  /** ISO 639-1. */
  readonly code: string;
  readonly name: string;
}
