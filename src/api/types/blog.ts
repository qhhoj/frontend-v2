import type { Schemas } from '../schemas';
import type { OrganizationSummary } from './organizations';

/** backend: blog/core/dto/post-list.dto.ts POST_FEEDS: the newsfeed (global, sticky first) or every personal post. */
export type PostFeed = 'global' | 'all';
/** backend: libs/community blog-posts.ts BLOG_PAGE_SIZE */
export const BLOG_PAGE_SIZE = 10;

/** backend: blog/core/dto/post.response.ts (PostListItemResponse) */
export type PostListItem = Schemas['PostListItemResponse'];
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
