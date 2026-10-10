import type { Schemas } from '../schemas';

export type CommentPageType = Schemas['CommentPageType'];
/** backend: libs/database COMMENT_PAGE_TYPES */
export const COMMENT_PAGE_TYPES = [
  'problem',
  'editorial',
  'contest',
  'blog',
  'tagProblem',
] as const satisfies readonly CommentPageType[];
/** backend: libs/community comments.ts */
export const COMMENT_MAX_LENGTH = 8192;
export const COMMENT_REPLY_WINDOW_MS = 365 * 86_400_000;
export const COMMENT_COLLAPSE_SCORE = -5;

/** backend: comments/core/dto/comment.response.ts (CommentPageLinkResponse) */
export type CommentPageLink = Schemas['CommentPageLinkResponse'];
/** backend: comment.response.ts (CommentResponse) */
export type Comment = Schemas['CommentResponse'];
/** backend: comment.response.ts (CommentPageResponse) */
export type CommentThreadPage = Schemas['CommentPageResponse'];
/** backend: comment.response.ts (CommentDetailResponse) */
export type CommentDetail = Schemas['CommentDetailResponse'];
/** backend: comments/core/dto/recent-comment.response.ts (RecentCommentResponse) */
export type RecentComment = Schemas['RecentCommentResponse'];
/** backend: comments/posting/dto/comment-revision.response.ts (CommentRevisionResponse); markdown before and after. */
export type CommentRevision = Schemas['CommentRevisionResponse'];
/** backend: comments/moderation/dto/comment-vote-entry.response.ts (CommentVoteEntryResponse) */
export type CommentVoteEntry = Schemas['CommentVoteEntryResponse'];
/** backend: comments/core/rate-limits.ts (COMMENT_LIMIT per COMMENT_WINDOW_SECONDS) */
export const COMMENT_RATE_LIMIT = 10;
export const COMMENT_RATE_WINDOW_MINUTES = 5;
/** backend: libs/community interaction.ts (INTERACT_MIN_PROBLEM_COUNT) */
export const INTERACT_MIN_PROBLEM_COUNT = 5;
