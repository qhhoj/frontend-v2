import { pastedLinkSegment } from '@/lib/pasted-link';

/** The username a box holds: `@bitcoder`, a pasted profile link or the bare name all give `bitcoder`. */
export const usernameFromInput = (text: string): string =>
  pastedLinkSegment(text, 'users') ??
  pastedLinkSegment(text, 'user') ??
  text.trim().replace(/^@+/, '').trim();
