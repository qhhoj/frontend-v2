import type { Schemas } from '../schemas';

/** One request row of the staff activity log (`GET /admin/user-activity/logs`). */
export type ActivityLog = Schemas['ActivityLogResponse'];
export type ActivitySession = Schemas['ActivitySessionResponse'];
export type ActivityCount = Schemas['ActivityCountResponse'];
export type ActivitySummary = Schemas['ActivitySummaryResponse'];
/** Visitors seen in the last `windowMinutes`; `users` is one page, most recently seen first. */
export type LiveActivity = Schemas['LiveActivityResponse'];
