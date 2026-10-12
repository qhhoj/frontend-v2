import type { CommentPostBlockReason, CommentThreadPage } from '@/api/types/comments';
import { COMMENT_REPLY_WINDOW_MS } from '@/api/types/comments';

/** What sits where the composer goes: the composer, or the panel saying why there is none. */
export type ComposerState = 'ready' | 'signedOut' | 'needsSolved' | 'muted' | 'locked' | 'contest';

const STATE_OF_BLOCK: Record<CommentPostBlockReason, ComposerState> = {
  signed_out: 'signedOut',
  needs_solved: 'needsSolved',
  muted: 'muted',
  locked: 'locked',
  contest: 'contest',
};

/**
 * A signed-in viewer gets the panel the backend's `postBlock` names (the rule posting enforces), or the composer. A signed-out
 * viewer is asked to sign in, unless the page is locked: signing in would not help then.
 */
export function composerStateOf(
  isSignedIn: boolean,
  page: Pick<CommentThreadPage, 'locked' | 'postBlock'>,
): ComposerState {
  if (!isSignedIn) return page.locked ? 'locked' : 'signedOut';
  return page.postBlock ? STATE_OF_BLOCK[page.postBlock.reason] : 'ready';
}

/** Legacy reply window: a comment older than a year takes replies only from moderators (`judge.change_comment`). */
export const canReplyTo = (createdAt: string, now: number, moderates: boolean): boolean =>
  moderates || now - Date.parse(createdAt) < COMMENT_REPLY_WINDOW_MS;
