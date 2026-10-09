import { apiGetPage, apiSend } from './typed';
import type { ContestTag, ContestTagBody, ContestTagPatch } from './types/contest-tags';

/** backend `MAX_CONTEST_TAGS`: one page of this size always holds the whole catalogue. */
export const CONTEST_TAG_PAGE_SIZE = 100;

export const fetchContestTags = async (): Promise<ContestTag[]> =>
  (
    await apiGetPage('/contest-tags', {
      query: { page: 1, pageSize: CONTEST_TAG_PAGE_SIZE },
    })
  ).items;
export const createContestTag = (body: ContestTagBody) =>
  apiSend('post', '/contest-tags', { body });
export const updateContestTag = (slug: string, body: ContestTagPatch) =>
  apiSend('patch', '/contest-tags/{slug}', { path: { slug }, body });
export const deleteContestTag = (slug: string) =>
  apiSend('delete', '/contest-tags/{slug}', { path: { slug } });
