import { apiPage, apiRequest } from './client';
import type { PostListItem } from './types/blog';

export type ModerationState = 'hidden' | 'scheduled';

const postPath = (id: string) => `/posts/${encodeURIComponent(id)}`;

/** B1: hiding is an edit (`visible: false`); the post leaves every list but stays reachable by its link for authors and staff. */
export const hidePost = (id: string) =>
  apiRequest<unknown>(postPath(id), { method: 'PATCH', body: { visible: false } });

/** Backend `BlogModerationController` (`judge.edit_all_post`): `hidden` = every draft, `scheduled` = visible posts whose publish time is ahead. */
export const fetchModerationPosts = (state: ModerationState, page: number) =>
  apiPage<PostListItem>('/admin/posts', { query: { state, page } });
