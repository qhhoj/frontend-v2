import { ApiError } from '@/api/client';
import type { PostListItem } from '@/api/types/blog';
import { translate } from '@/i18n';
import { failureTextOf } from '../ui/admin-errors';

/** backend: blog-editing.service.ts `refuseInOfficialContest`; every other 403 keeps the shared "forbidden" text. */
const CONTEST_LOCK_MESSAGE = 'Blog posts are locked during the official contest';

export interface UnhidePlan {
  /** True when the publish time is after now: the post becomes visible but stays in the scheduled queue. */
  scheduled: boolean;
}

export const unhidePlanOf = (post: Pick<PostListItem, 'publishOn'>, now: number): UnhidePlan => ({
  scheduled: Date.parse(post.publishOn) > now,
});

/** The text of a refused hide or show: official-contest mode says so, anything else reads as the shared admin text. */
export function visibilityFailureText(error: unknown): string {
  if (error instanceof ApiError && error.status === 403 && error.message === CONTEST_LOCK_MESSAGE)
    return translate('admin.posts.contestLocked');
  return failureTextOf(error);
}
