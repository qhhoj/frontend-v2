import { trustedUntilBackendFixed } from './backend-ask';
import type { PostFeed } from './types/blog';
import type { VoteResponse, VoteScore } from './types/votes';
import { apiGet, apiGetPage, apiSend } from './typed';

export const fetchPosts = (feed: PostFeed, page: number) =>
  apiGetPage('/posts', { query: { feed, page } });
export const fetchPost = (id: string) => apiGet('/posts/{id}', { path: { id } });
export const votePost = async (id: string, score: VoteScore) =>
  trustedUntilBackendFixed<VoteResponse>(
    'M5-01',
    await apiSend('put', '/posts/{id}/vote', { path: { id }, body: { score } }),
  );
