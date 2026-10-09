import { apiGetPage } from './typed';
import type { QueryOf } from './typed';

/** The page, size, language and `q` the index sends; `visibility` is fixed by `fetchAdminProblems`. */
export type AdminProblemSearch = Required<
  Pick<QueryOf<'/problems'>, 'page' | 'pageSize' | 'lang' | 'q'>
>;

/** The staff index of problems: `visibility=all` adds private problems (the backend still limits the list to what the account may see). */
export const fetchAdminProblems = (query: AdminProblemSearch) =>
  apiGetPage('/problems', { query: { ...query, visibility: 'all' } });
