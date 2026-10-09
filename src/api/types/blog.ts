import type { Schemas } from '../schemas';

/** backend: blog/core/dto/post-list.dto.ts POST_FEEDS: the newsfeed (global, sticky first) or every personal post. */
export type PostFeed = Schemas['PostFeed'];
/** backend: libs/community blog-posts.ts BLOG_PAGE_SIZE */
export const BLOG_PAGE_SIZE = 10;

/** backend: blog/core/dto/post.response.ts (PostListItemResponse) */
export type PostListItem = Schemas['PostListItemResponse'];
/** backend: post.response.ts (PostDetailResponse) */
export type PostDetail = Schemas['PostDetailResponse'];
