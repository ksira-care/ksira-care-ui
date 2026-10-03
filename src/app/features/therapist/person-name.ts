function nameParts(fullName: string | null | undefined): string[] {
  return (fullName ?? '').trim().split(/\s+/).filter(Boolean);
}

/** "Aanya Mehta" → "Aanya". */
export function firstName(fullName: string | null | undefined): string {
  return nameParts(fullName)[0] ?? '';
}

/** "Aanya Mehta" → "AM"; "Aanya" → "A". For the avatar. */
export function initials(fullName: string | null | undefined): string {
  const parts = nameParts(fullName);
  if (parts.length === 0) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/** "Sara Lopez" → "Sara L." — enough to recognise a client without showing their full name. */
export function abbreviatedName(fullName: string | null | undefined): string {
  const parts = nameParts(fullName);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
