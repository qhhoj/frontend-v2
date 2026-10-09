/** The four tabs of the blog moderation screen: two public feeds (`usePostsQuery`) and two moderation queues (`useModerationPostsQuery`). */
export const MODERATION_FEEDS = ['all', 'global', 'hidden', 'scheduled'] as const;
export type ModerationFeed = (typeof MODERATION_FEEDS)[number];
export type PublicFeed = Extract<ModerationFeed, 'all' | 'global'>;
export type QueueFeed = Extract<ModerationFeed, 'hidden' | 'scheduled'>;

export const isQueueFeed = (feed: ModerationFeed): feed is QueueFeed =>
  feed === 'hidden' || feed === 'scheduled';

/** A missing or unknown `?feed=` is the default tab, "Mọi bài cá nhân". */
export const feedFromQuery = (value: unknown): ModerationFeed =>
  MODERATION_FEEDS.find((feed) => feed === value) ?? 'all';

/** The text of a failed row action, kept with the post it was for. */
export interface RowFailure {
  postId: string;
  text: string;
}
