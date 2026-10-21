const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

/**
 * Turns ISO 639-1 codes like ["hi", "en"] into "Hindi, English". A code the
 * browser can't name is shown as given rather than dropped.
 */
export function formatLanguages(codes: readonly string[]): string {
  return codes
    .map((code) => {
      try {
        return languageNames.of(code) ?? code;
      } catch {
        return code;
      }
    })
    .join(', ');
}
