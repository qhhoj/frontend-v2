import { apiGet, apiSend } from './typed';
import type { PolygonImportBody, PolygonProblemsQuery } from './types/polygon';

/** Whether the key and secret are set, and the account name setters share with; no call to Polygon. */
export const fetchPolygonStatus = () => apiGet('/polygon/status');

/** Every problem shared with the account; `refresh` skips the server's 60 s cache (6 per minute). */
export const fetchPolygonProblems = (query: PolygonProblemsQuery = {}) =>
  apiGet('/polygon/problems', { query });

export const startPolygonLinkImport = (polygonId: number, body: PolygonImportBody) =>
  apiSend('post', '/polygon/problems/{polygonId}/import', { path: { polygonId }, body });

/** One `problems.list` call with the saved key and secret. */
export const testPolygonConnection = () => apiSend('post', '/polygon/test');

export const fetchPolygonLink = (code: string) =>
  apiGet('/problems/{code}/polygon', { path: { code } });

export const syncPolygonLink = (code: string) =>
  apiSend('post', '/problems/{code}/polygon/sync', { path: { code } });

export const updatePolygonLink = (code: string, autoSync: boolean) =>
  apiSend('patch', '/problems/{code}/polygon', { path: { code }, body: { autoSync } });

export const unlinkPolygon = (code: string) =>
  apiSend('delete', '/problems/{code}/polygon', { path: { code } });
