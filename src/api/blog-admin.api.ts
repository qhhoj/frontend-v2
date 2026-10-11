import { apiGetPage, apiSend } from './typed';
import type { JsonBodyOf, QueryOf } from './typed';

export type ModerationState = QueryOf<'/admin/posts'>['state'];
/** The flags a moderator flips from the list, one at a time. */
export type PostFlagPatch = Pick<
  JsonBodyOf<'/posts/{id}', 'patch'>,
  'visible' | 'sticky' | 'globalPost'
>;

/**
 * B1: hiding is an edit (`visible: false`): the post leaves every list but stays reachable by its link for authors and staff;
 * showing a post whose publish time is ahead puts it in the scheduled queue. Pinning and marking global need `pin_post`
 * and `mark_global_post`. Sent alone by `edit_all_post`, a flag skips the write limit.
 */
export const patchPostFlag = (id: string, patch: PostFlagPatch) =>
  apiSend('patch', '/posts/{id}', { path: { id }, body: patch });

/** Backend `BlogModerationController` (`judge.edit_all_post`): `hidden` = every draft, `scheduled` = visible posts whose publish time is ahead, `organization` = organization posts, `any` = every post; `search` = title text or an author's exact username; `organization` = one organization's slug. */
export const fetchModerationPosts = (
  state: ModerationState,
  page: number,
  { search = '', organization = '' }: { search?: string; organization?: string } = {},
) =>
  apiGetPage('/admin/posts', {
    query: {
      state,
      page,
      ...(search ? { search } : {}),
      ...(organization ? { organization } : {}),
    },
  });
