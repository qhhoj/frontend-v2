import type { UserSummary } from './problems';
import type { VoteScore } from './votes';

/** backend: libs/database COMMENT_PAGE_TYPES */
export const COMMENT_PAGE_TYPES = [
  'problem',
  'editorial',
  'contest',
  'blog',
  'tagProblem',
] as const;
export type CommentPageType = (typeof COMMENT_PAGE_TYPES)[number];
/** backend: libs/community comments.ts */
export const COMMENT_MAX_LENGTH = 8192;
export const COMMENT_REPLY_WINDOW_MS = 365 * 86_400_000;
export const COMMENT_COLLAPSE_SCORE = -5;

/** backend: comments/core/dto/comment.response.ts (CommentPageLinkResponse) */
export interface CommentPageLink {
  type: CommentPageType;
  /** Problem code, contest key, post id or tag problem code. */
  key: string;
  title: string;
}
/** backend: comment.response.ts (CommentResponse) */
export interface Comment {
  id: string;
  parentId: string | null;
  depth: number;
  /** Null when the author's account is gone. */
  author: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  bodyHtml: string;
  /** Markdown source for the edit form: only when `canEdit`, else null. */
  body: string | null;
  score: number;
  collapsed: boolean;
  /** How many times it was edited. */
  revisions: number;
  viewerVote: VoteScore;
  canEdit: boolean;
}
/** backend: comment.response.ts (CommentPageResponse) */
export interface CommentThreadPage {
  page: CommentPageLink;
  locked: boolean;
  canComment: boolean;
  /** Roots newest first, each followed by its visible replies in tree order. */
  comments: Comment[];
  pagination: { page: number; pageSize: number; total: number };
}
/** backend: comment.response.ts (CommentDetailResponse) */
export interface CommentDetail extends Comment {
  page: CommentPageLink;
  hidden: boolean;
}
/** backend: comments/core/dto/recent-comment.response.ts (RecentCommentResponse) */
export interface RecentComment extends Comment {
  page: CommentPageLink;
}
/** backend: comments/posting/dto/comment-revision.response.ts (CommentRevisionResponse); markdown before and after. */
export interface CommentRevision {
  at: string;
  editor: UserSummary | null;
  before: string;
  after: string;
}
/** backend: comments/moderation/dto/comment-vote-entry.response.ts (CommentVoteEntryResponse) */
export interface CommentVoteEntry {
  voter: UserSummary | null;
  score: number;
}
