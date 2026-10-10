import type { CommentThreadPage } from '@/api/types/comments';
import { COMMENT_REPLY_WINDOW_MS } from '@/api/types/comments';

/** What sits where the composer goes: the composer, or the panel saying why there is none. */
export type ComposerState = 'ready' | 'signedOut' | 'gated' | 'locked';

/**
 * A lock (a moderator's, or the viewer's running contest) beats everything: signing in would not help. A signed-in viewer the
 * backend refuses (`canComment` false while unlocked) is under the interaction gate: too few solves, or muted; the session does
 * not say which.
 */
export function composerStateOf(
  isSignedIn: boolean,
  page: Pick<CommentThreadPage, 'locked' | 'canComment'>,
): ComposerState {
  if (page.locked) return 'locked';
  if (!isSignedIn) return 'signedOut';
  return page.canComment ? 'ready' : 'gated';
}

/** Legacy reply window: a comment older than a year takes replies only from moderators (`judge.change_comment`). */
export const canReplyTo = (createdAt: string, now: number, moderates: boolean): boolean =>
  moderates || now - Date.parse(createdAt) < COMMENT_REPLY_WINDOW_MS;
