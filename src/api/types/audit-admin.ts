import type { Schemas } from '../schemas';

/** One recorded change of the global change log (`GET /admin/audit`). */
export type AuditEntry = Schemas['AuditEntryResponse'];
export type AuditFeed = Schemas['AuditFeedResponse'];
