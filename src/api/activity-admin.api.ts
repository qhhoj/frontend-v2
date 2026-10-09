import { apiPage, apiRequest, buildUrl } from './client';
import type { ActivityLog, ActivitySummary, LiveActivity } from './types/activity-admin';

/** The filter fields the backend reads; an empty or missing field is not sent. */
export interface ActivityRequest {
  user?: string;
  ip?: string;
  path?: string;
  days: number;
}

const BASE = '/admin/user-activity';

export const fetchActivityLogs = (request: ActivityRequest & { page: number }) =>
  apiPage<ActivityLog>(`${BASE}/logs`, { query: { ...request } });

/** A plain download link: the GET carries the session cookie, and the backend streams the CSV (at most 100 000 rows, newest first). */
export const activityExportUrl = (request: ActivityRequest) =>
  buildUrl(`${BASE}/logs/export`, { ...request });

export const fetchActivitySummary = (username: string, days: number) =>
  apiRequest<ActivitySummary>(`${BASE}/users/${encodeURIComponent(username)}/summary`, {
    query: { days },
  });

export const fetchLiveActivity = (page: number) =>
  apiRequest<LiveActivity>(`${BASE}/live`, { query: { page } });

export const deleteUserActivity = (username: string) =>
  apiRequest<void>(`${BASE}/users/${encodeURIComponent(username)}`, { method: 'DELETE' });

export const deleteAnonymousActivity = () =>
  apiRequest<void>(`${BASE}/anonymous`, { method: 'DELETE' });
