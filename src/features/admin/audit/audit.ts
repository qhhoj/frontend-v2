import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { AuditRequest } from '@/api/audit-admin.api';
import type { AuditEntry } from '@/api/types/audit-admin';
import { adminRouteName } from '../admin-screens';

/** Every kind the backend can filter by (`AUDIT_TYPES`), in the order the filter lists them. */
export const AUDIT_TYPES = [
  'problem',
  'tagProblem',
  'problemType',
  'problemGroup',
  'license',
  'contest',
  'contestParticipation',
  'submission',
  'submission_batch',
  'user',
  'group',
  'organization',
  'blogPost',
  'comment',
  'flatpage',
  'setting',
] as const satisfies readonly NonNullable<AuditRequest['type']>[];
export type AuditType = (typeof AUDIT_TYPES)[number];

/** The feed filter as the URL keeps it: an exact username, a kind, and a day range in the viewer's calendar. */
export interface AuditFilter {
  actor: string;
  type: AuditType | '';
  /** `YYYY-MM-DD`, first day shown. */
  from: string;
  /** `YYYY-MM-DD`, last day shown (inclusive). */
  to: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const day = (value: unknown) => (DAY.test(text(value)) ? text(value) : '');
const isAuditType = (value: unknown): value is AuditType =>
  AUDIT_TYPES.some((type) => type === value);

export function auditFilterFromQuery(query: LocationQuery): AuditFilter {
  return {
    actor: text(query.actor).trim(),
    type: isAuditType(query.type) ? query.type : '',
    from: day(query.from),
    to: day(query.to),
  };
}

/** Only the fields that are set, so a clean URL means "everything". */
export function auditFilterQuery(filter: AuditFilter): LocationQueryRaw {
  return Object.fromEntries(Object.entries(filter).filter(([, value]) => value !== ''));
}

/** Local midnight of a `YYYY-MM-DD` day, plus `days`. */
function localDayStart(value: string, days = 0): string {
  const [year, month, date] = value.split('-').map(Number);
  return new Date(year!, month! - 1, date! + days).toISOString();
}

/** The request for the filter: the day range becomes `[from 00:00, the day after to 00:00)` in the viewer's zone. */
export function toAuditRequest(filter: AuditFilter): AuditRequest {
  return {
    ...(filter.actor && { actor: filter.actor }),
    ...(filter.type && { type: filter.type }),
    ...(filter.from && { from: localDayStart(filter.from) }),
    ...(filter.to && { to: localDayStart(filter.to, 1) }),
  };
}

/**
 * Where an entry's object is edited, or `null` when it cannot be opened: it is gone, or its kind has no screen
 * (a comment, a batch rejudge, a role). A participation opens its contest's participants.
 */
export function auditObjectLink(entry: AuditEntry): RouteLocationRaw | null {
  const { label, id, deleted } = entry.object;
  if (deleted) return null;
  switch (entry.type) {
    case 'problem':
    case 'tagProblem':
      return label ? { name: adminRouteName('problemGeneral'), params: { code: label } } : null;
    case 'contest':
      return label ? { name: adminRouteName('contestGeneral'), params: { key: label } } : null;
    case 'contestParticipation':
      return label ? { name: adminRouteName('contestParticipants'), params: { key: label } } : null;
    case 'user':
      return label ? { name: adminRouteName('users'), query: { user: label } } : null;
    case 'organization':
      return label ? { name: 'organization', params: { slug: label } } : null;
    case 'flatpage':
      return { name: adminRouteName('pages'), query: { page: id } };
    case 'blogPost':
      return { name: 'post', params: { id } };
    case 'submission':
      return { name: 'submission', params: { id } };
    case 'problemType':
    case 'problemGroup':
    case 'license':
      return { name: adminRouteName('types') };
    case 'setting':
      return { name: adminRouteName('log'), query: { view: 'settings', key: id } };
    default:
      return null;
  }
}
