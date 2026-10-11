import { apiGetPage } from './typed';

/** How many hits of each kind the admin search palette shows. */
export const ADMIN_SEARCH_LIMIT = 5;
/** The first page at the palette's size; the problem and contest indexes take it through their own fetchers. */
export const ADMIN_SEARCH_PAGE = { page: 1, pageSize: ADMIN_SEARCH_LIMIT } as const;

/** Backend `UserAdminController` (`judge.ban_user`): `search` is a username prefix. */
export const searchAdminUsers = (search: string) =>
  apiGetPage('/admin/users', { query: { ...ADMIN_SEARCH_PAGE, search } });
/** The organization index at the palette's size (`fetchOrganizations` always reads the largest page). */
export const searchAdminOrganizations = (search: string) =>
  apiGetPage('/organizations', { query: { ...ADMIN_SEARCH_PAGE, search } });
