import { apiGet } from './typed';
import type { QueryOf } from './typed';

/** The feed filters the backend reads; `before` pages to older entries. */
export type AuditRequest = QueryOf<'/admin/audit'>;

export const fetchAuditFeed = (request: AuditRequest) =>
  apiGet('/admin/audit', { query: { ...request } });
