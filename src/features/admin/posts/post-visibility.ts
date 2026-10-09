import type { PostListItem } from '@/api/types/blog';

export interface UnhidePlan {
  /** True when the publish time is after now: the post becomes visible but stays in the scheduled queue. */
  scheduled: boolean;
}

export const unhidePlanOf = (post: Pick<PostListItem, 'publishOn'>, now: number): UnhidePlan => ({
  scheduled: Date.parse(post.publishOn) > now,
});
