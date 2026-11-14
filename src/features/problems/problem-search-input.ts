import { pastedLinkSegment } from '@/lib/pasted-link';

/** What an Enter in the search box means: a pasted problem link names its problem; anything else is searched as typed. */
export function problemSearchIntent(text: string): { code: string; isLink: boolean } {
  const linked = pastedLinkSegment(text, 'problems');
  return linked === null ? { code: text.trim(), isLink: false } : { code: linked, isLink: true };
}

/** The listed code that equals `code` ignoring case (codes are case-insensitive to type, exact to open), else null. */
export const listedCode = (codes: readonly string[], code: string): string | null =>
  codes.find((candidate) => candidate.toLowerCase() === code.toLowerCase()) ?? null;
