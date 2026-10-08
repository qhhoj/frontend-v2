import type { OrganizationSummary } from './organizations';
import type { UserSummary } from './problems';
import type { VoteScore } from './votes';

/** backend: blog/core/dto/post-list.dto.ts POST_FEEDS: the newsfeed (global, sticky first) or every personal post. */
export type PostFeed = 'global' | 'all';
/** backend: libs/community blog-posts.ts BLOG_PAGE_SIZE */
export const BLOG_PAGE_SIZE = 10;

/** backend: blog/core/dto/post.response.ts (PostListItemResponse) */
export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  authors: UserSummary[];
  sticky: boolean;
  globalPost: boolean;
  visible: boolean;
  publishOn: string;
  /** Sanitized HTML: the summary, else the content. */
  summaryHtml: string;
  score: number;
  viewerVote: VoteScore;
  commentCount: number;
}
/** backend: post.response.ts (PostDetailResponse) */
export interface PostDetail extends PostListItem {
  contentHtml: string;
  ogImage: string;
  organization: OrganizationSummary | null;
  canEdit: boolean;
  canDelete: boolean;
  content: string | null;
  summary: string | null;
}
