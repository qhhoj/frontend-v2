import type { PostFlagPatch } from '@/api/blog-admin.api';

/** The tabs of the blog moderation screen: two public feeds (`usePostsQuery`) and four moderation queues (`useModerationPostsQuery`). */
export const MODERATION_FEEDS = [
  'all',
  'global',
  'hidden',
  'scheduled',
  'organization',
  'any',
] as const;
export type ModerationFeed = (typeof MODERATION_FEEDS)[number];
export type PublicFeed = Extract<ModerationFeed, 'all' | 'global'>;
export type QueueFeed = Exclude<ModerationFeed, PublicFeed>;

export const isQueueFeed = (feed: ModerationFeed): feed is QueueFeed =>
  feed !== 'all' && feed !== 'global';

/** A search runs on the moderation queues only: from a public feed it searches every post. */
export const searchFeedOf = (feed: ModerationFeed): QueueFeed => (isQueueFeed(feed) ? feed : 'any');

/** A missing or unknown `?feed=` is the default tab, "Mọi bài cá nhân". */
export const feedFromQuery = (value: unknown): ModerationFeed =>
  MODERATION_FEEDS.find((feed) => feed === value) ?? 'all';

/** The text of a failed row action, kept with the post it was for. */
export interface RowFailure {
  postId: string;
  text: string;
}

/** A pin or newsfeed change from a row. */
export type PostFlags = Pick<PostFlagPatch, 'sticky' | 'globalPost'>;
