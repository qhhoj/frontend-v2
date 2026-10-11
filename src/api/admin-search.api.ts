import type { Locale } from '@/i18n';
import { apiGetPage } from './typed';

/** How many hits of each kind the admin search palette shows. */
export const ADMIN_SEARCH_LIMIT = 5;
const firstPage = { page: 1, pageSize: ADMIN_SEARCH_LIMIT } as const;

/** Each read is the index the matching admin screen uses, so the backend applies the same visibility to the palette. */
export const searchAdminProblems = (term: string, lang: Locale) =>
  apiGetPage('/problems', { query: { ...firstPage, q: term, lang, visibility: 'all' } });
export const searchAdminContests = (term: string) =>
  apiGetPage('/contests', { query: { ...firstPage, q: term } });
/** Backend `UserAdminController` (`judge.ban_user`): `search` is a username prefix. */
export const searchAdminUsers = (search: string) =>
  apiGetPage('/admin/users', { query: { ...firstPage, search } });
export const searchAdminOrganizations = (search: string) =>
  apiGetPage('/organizations', { query: { ...firstPage, search } });
