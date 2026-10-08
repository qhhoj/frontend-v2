import { apiPage, apiRequest } from './client';
import type { PostDetail, PostFeed, PostListItem } from './types/blog';
import type { VoteResponse, VoteScore } from './types/votes';

const postPath = (id: string) => `/posts/${encodeURIComponent(id)}`;

export const fetchPosts = (feed: PostFeed, page: number) =>
  apiPage<PostListItem>('/posts', { query: { feed, page } });
export const fetchPost = (id: string) => apiRequest<PostDetail>(postPath(id));
export const votePost = (id: string, score: VoteScore) =>
  apiRequest<VoteResponse>(`${postPath(id)}/vote`, { method: 'PUT', body: { score } });
