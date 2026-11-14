import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: shares/dto (ShareViewResponse): the page of `/c/<code>`. */
export type ShareView = Schemas['ShareViewResponse'];
/** backend: shares/dto (ShareSummaryResponse): what create and edit return. */
export type ShareSummary = Schemas['ShareSummaryResponse'];
/** backend: shares/dto (ShareListItemResponse): a row of "My shares" and of the staff list. */
export type ShareListItem = Schemas['ShareListItemResponse'];
export type ShareReport = Schemas['ShareReportResponse'];
export type ShareKind = Schemas['ShareKind'];
export type ShareExpiry = Schemas['ShareExpiry'];
export type ShareReportReason = Schemas['ShareReportReason'];
export type ShareHiddenReason = Schemas['ShareHiddenReason'];
export type CreatePasteBody = JsonBodyOf<'/shares/pastes', 'post'>;
export type CreateSubmissionShareBody = JsonBodyOf<'/shares/submissions', 'post'>;
export type EditShareBody = JsonBodyOf<'/shares/{code}', 'patch'>;
export type ShareListQuery = QueryOf<'/shares'>;
export type ShareReportQueue = NonNullable<QueryOf<'/shares/reports'>['status']>;
/** Reports are settled as the comment queue's: `resolved` when they led to action, `dismissed` when not. */
export type ShareReportOutcome = Schemas['CommentReportOutcome'];

/** backend: pastes are at most 65 536 bytes of UTF-8 (`source_too_large`). */
export const PASTE_MAX_BYTES = 65_536;
