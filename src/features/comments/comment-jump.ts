import type { CommentLocation, CommentPageType } from '@/api/types/comments';
import { commentAnchor } from './comment-quote';

/** The comment id a `#comment-<id>` hash names; null for any other hash. */
export function commentIdFromHash(hash: string): string | null {
  const prefix = `#${commentAnchor('')}`;
  return hash.startsWith(prefix) && hash.length > prefix.length ? hash.slice(prefix.length) : null;
}

/** The listing page to open so a located comment shows: null when it is on the page shown, or lives under another page. */
export function pageToOpen(
  location: CommentLocation,
  shown: { type: CommentPageType; key: string; page: number },
): number | null {
  if (location.page.type !== shown.type || location.page.key !== shown.key) return null;
  return location.pageNumber === shown.page ? null : location.pageNumber;
}
