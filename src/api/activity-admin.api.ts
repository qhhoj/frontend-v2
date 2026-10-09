import { apiGet, apiGetPage, apiSend, apiUrl } from './typed';
import type { QueryOf } from './typed';

/** The filter fields the backend reads; an empty or missing field is not sent. */
export type ActivityRequest = Omit<QueryOf<'/admin/user-activity/logs'>, 'page'>;

export const fetchActivityLogs = (request: ActivityRequest & { page: number }) =>
  apiGetPage('/admin/user-activity/logs', { query: { ...request } });

/** A plain download link: the GET carries the session cookie, and the backend streams the CSV (at most 100 000 rows, newest first). */
export const activityExportUrl = (request: ActivityRequest) =>
  apiUrl('/admin/user-activity/logs/export', { query: { ...request } });

export const fetchActivitySummary = (username: string, days: number) =>
  apiGet('/admin/user-activity/users/{username}/summary', {
    path: { username },
    query: { days },
  });

export const fetchLiveActivity = (page: number) =>
  apiGet('/admin/user-activity/live', { query: { page } });

export const deleteUserActivity = (username: string) =>
  apiSend('delete', '/admin/user-activity/users/{username}', { path: { username } });

export const deleteAnonymousActivity = () => apiSend('delete', '/admin/user-activity/anonymous');
