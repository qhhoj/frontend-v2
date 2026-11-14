import type { ShareExpiry } from '@/api/types/shares';
import { translate } from '@/i18n';

/** The lifetimes the backend accepts, in the order the picker lists them. */
export const SHARE_EXPIRIES: readonly ShareExpiry[] = ['never', '1d', '7d', '30d'];
/** A copy of a submission is a record of a result; a paste is ephemeral (backend defaults). */
export const SUBMISSION_DEFAULT_EXPIRY: ShareExpiry = 'never';
export const PASTE_DEFAULT_EXPIRY: ShareExpiry = '30d';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export interface ExpiryText {
  /** i18n key under `share.expiry`. */
  key: 'never' | 'expired' | 'days' | 'hours' | 'soon';
  count?: number;
}

/** How a link's end reads now: "never", whole days left (rounded up), else hours, else "in a few minutes". */
export function expiryText(expiresAt: string | null, now: number): ExpiryText {
  if (expiresAt === null) return { key: 'never' };
  const left = new Date(expiresAt).getTime() - now;
  if (left <= 0) return { key: 'expired' };
  if (left >= DAY_MS) return { key: 'days', count: Math.ceil(left / DAY_MS) };
  if (left >= HOUR_MS) return { key: 'hours', count: Math.ceil(left / HOUR_MS) };
  return { key: 'soon' };
}

/** The sentence for `expiryText`: "Không hết hạn", "Hết hạn sau 29 ngày", "Đã hết hạn". */
export function expiryMessage(expiresAt: string | null, now: number): string {
  const { key, count } = expiryText(expiresAt, now);
  return translate(`share.expiry.${key}`, { count: count ?? 0 }, count ?? 0);
}
