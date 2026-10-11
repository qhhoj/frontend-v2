import type { PostFeed } from './types/blog';
import type { VoteScore } from './types/votes';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { JsonBodyOf } from './typed';

export const fetchPosts = (feed: PostFeed, page: number) =>
  apiGetPage('/posts', { query: { feed, page } });
export const fetchPost = (id: string) => apiGet('/posts/{id}', { path: { id } });
export const votePost = (id: string, score: VoteScore) =>
  apiSend('put', '/posts/{id}/vote', { path: { id }, body: { score } });

export type PostCreateBody = JsonBodyOf<'/posts', 'post'>;
export type PostPatch = JsonBodyOf<'/posts/{id}', 'patch'>;

/** Backend `BlogEditingController`: a personal post, or an organization post with `organization`. */
export const createPost = (body: PostCreateBody) => apiSend('post', '/posts', { body });
/** Only the fields sent change; the staff fields and flags need their permissions. */
export const updatePost = (id: string, body: PostPatch) =>
  apiSend('patch', '/posts/{id}', { path: { id }, body });
/** Edit rights plus `judge.delete_blogpost`; the discussion goes with it. */
export const deletePost = (id: string) => apiSend('delete', '/posts/{id}', { path: { id } });
