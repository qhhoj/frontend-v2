import { apiGetPage, apiSend } from './typed';
import type { JsonBodyOf, QueryOf } from './typed';

/** What the staff problem list sends: filters, sort and page; `pageSize` and `lang` come from the page. */
export type AdminProblemSearch = QueryOf<'/problems'>;

/** The staff index of problems: `visibility` defaults to `all` (private ones too); the backend still limits the list to what the account may see. */
export const fetchAdminProblems = (query: AdminProblemSearch) =>
  apiGetPage('/problems', { query: { visibility: 'all', ...query } });

/** `POST /problems/bulk/visibility` (`judge.change_public_visibility`): one PATCH per code, results per code. */
export type BulkVisibilityBody = JsonBodyOf<'/problems/bulk/visibility', 'post'>;
export const setProblemsVisibility = (body: BulkVisibilityBody) =>
  apiSend('post', '/problems/bulk/visibility', { body });
