import { htmlExcerpt } from '@/lib/html-excerpt';
import type { NumberedComment } from './comment-order';

/** Characters of the parent's prose a reply quotes. */
export const QUOTE_LENGTH = 100;

/** What a reply shows of the comment it answers; `number` and `author` are null when the parent is not on the page or its account is gone. */
export interface CommentQuote {
  parentId: string;
  number: number | null;
  author: string | null;
  excerpt: string;
  /** In-page anchor of the parent. */
  href: string;
}

export const commentAnchor = (id: string) => `comment-${id}`;

/** The quote block of a reply to `parentId`, built from the parent as the page holds it (a thread's replies come on its root's page). */
export function quoteOf(
  parentId: string,
  byId: ReadonlyMap<string, NumberedComment>,
): CommentQuote {
  const parent = byId.get(parentId);
  return {
    parentId,
    number: parent?.number ?? null,
    author: parent?.comment.author?.username ?? null,
    excerpt: parent ? htmlExcerpt(parent.comment.bodyHtml, QUOTE_LENGTH) : '',
    href: `#${commentAnchor(parentId)}`,
  };
}
