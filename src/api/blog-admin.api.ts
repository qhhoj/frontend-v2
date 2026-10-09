import { apiGetPage, apiSend } from './typed';
import type { QueryOf } from './typed';

export type ModerationState = QueryOf<'/admin/posts'>['state'];

const patchVisible = (id: string, visible: boolean) =>
  apiSend('patch', '/posts/{id}', { path: { id }, body: { visible } });

/** B1: hiding is an edit (`visible: false`); the post leaves every list but stays reachable by its link for authors and staff. */
export const hidePost = (id: string) => patchVisible(id, false);

/** The undo of `hidePost`: a post whose publish time is ahead lands in the scheduled queue, any other is public at once. */
export const showPost = (id: string) => patchVisible(id, true);

/** Backend `BlogModerationController` (`judge.edit_all_post`): `hidden` = every draft, `scheduled` = visible posts whose publish time is ahead. */
export const fetchModerationPosts = (state: ModerationState, page: number) =>
  apiGetPage('/admin/posts', { query: { state, page } });
