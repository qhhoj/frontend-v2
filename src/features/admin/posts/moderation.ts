/** The four tabs of the blog moderation screen: two public feeds (`usePostsQuery`) and two moderation queues (`useModerationPostsQuery`). */
export const MODERATION_FEEDS = ['all', 'global', 'hidden', 'scheduled'] as const;
export type ModerationFeed = (typeof MODERATION_FEEDS)[number];
export type PublicFeed = Extract<ModerationFeed, 'all' | 'global'>;
export type QueueFeed = Extract<ModerationFeed, 'hidden' | 'scheduled'>;

/** Backend `page` is at most 10 000: anything else is the first page. */
export const MAX_MODERATION_PAGE = 10_000;

export const isQueueFeed = (feed: ModerationFeed): feed is QueueFeed =>
  feed === 'hidden' || feed === 'scheduled';

/** A missing or unknown `?feed=` is the default tab, "Mọi bài cá nhân". */
export const feedFromQuery = (value: unknown): ModerationFeed =>
  MODERATION_FEEDS.find((feed) => feed === value) ?? 'all';

/** A missing, non-integer or out-of-range `?page=` is the first page. */
export function pageFromQuery(value: unknown): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= MAX_MODERATION_PAGE ? page : 1;
}

/** The text of a failed row action, kept with the post it was for. */
export interface RowFailure {
  postId: string;
  text: string;
}
