import { apiGet, apiSend, apiUrl } from './typed';
import type { ImportGhostsBody } from './types/contest-ghosts';

export const fetchGhosts = (key: string) => apiGet('/contests/{key}/ghosts', { path: { key } });
/** `dryRun` previews without storing; otherwise the whole set is replaced at once. */
export const importGhosts = (key: string, body: ImportGhostsBody) =>
  apiSend('put', '/contests/{key}/ghosts', { path: { key }, body });
export const deleteGhosts = (key: string) =>
  apiSend('delete', '/contests/{key}/ghosts', { path: { key } });
/** The current set as an attachment in the import grammar (a plain same-origin link). */
export const ghostsCsvUrl = (key: string) =>
  apiUrl('/contests/{key}/ghosts/csv', { path: { key } });
