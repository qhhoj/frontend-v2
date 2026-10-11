import type { Comment } from '@/api/types/comments';

/** A comment with its display number: its stable per-page `number` from the API, else its place (1-based) in this page's time order. */
export interface NumberedComment {
  comment: Comment;
  number: number;
}

/**
 * Layout C2 (flat, with quotes): the API sends one page of threads (roots newest first, each followed by its replies);
 * the page is shown as one flat list, oldest first. Ties keep id order (ids are UUIDv7, so time-ordered too).
 */
export function flattenInTimeOrder(comments: readonly Comment[]): NumberedComment[] {
  return [...comments]
    .sort(
      (first, second) =>
        Date.parse(first.createdAt) - Date.parse(second.createdAt) ||
        first.id.localeCompare(second.id),
    )
    .map((comment, index) => ({ comment, number: comment.number ?? index + 1 }));
}
