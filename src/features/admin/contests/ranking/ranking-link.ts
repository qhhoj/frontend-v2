import type { RankingLinkPatch } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatClock, formatDate } from '@/lib/format-date';

export const OFFICIAL_CSV_MAX_BYTES = 1024 * 1024;
/** Backend `RankingLinkDto.expiryAmount` `@Max`. */
export const MAX_EXPIRY_AMOUNT = 1_000_000;

export interface LinkForm {
  status: 'public' | 'private';
  expiryMode: 'U' | 'M' | 'D' | 'A';
  expiryAmount: number | null;
  /** An ISO instant, '' while unset. */
  expiresAt: string;
}

export const publicRankingUrl = (token: string, origin: string) =>
  `${origin}/public-rankings/${encodeURIComponent(token)}`;

const isWholeAmount = (amount: number | null): amount is number =>
  amount !== null && Number.isInteger(amount) && amount >= 1 && amount <= MAX_EXPIRY_AMOUNT;

/** The patch for the form's mode: `U` sends neither an amount nor a date; a refusal names what is missing. */
export function toLinkPatch(form: LinkForm): RankingLinkPatch | { error: string } {
  const base = { status: form.status, expiryMode: form.expiryMode };
  if (form.expiryMode === 'U') return base;
  if (form.expiryMode === 'A') {
    return form.expiresAt
      ? { ...base, expiresAt: form.expiresAt }
      : { error: translate('admin.contests.ranking.link.needsDate') };
  }
  return isWholeAmount(form.expiryAmount)
    ? { ...base, expiryAmount: form.expiryAmount }
    : { error: translate('admin.contests.ranking.link.needsAmount') };
}

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** What the link will expire at, counted from the link's last regeneration (as the backend does), in words and the viewer's zone and locale; null for the modes without an amount. */
export function expiryPreview(form: LinkForm, regeneratedAt: Date, locale: Locale): string | null {
  if ((form.expiryMode !== 'M' && form.expiryMode !== 'D') || !isWholeAmount(form.expiryAmount))
    return null;
  const step = form.expiryMode === 'M' ? MINUTE_MS : DAY_MS;
  const until = new Date(regeneratedAt.getTime() + form.expiryAmount * step);
  const when = {
    amount: form.expiryAmount,
    date: formatDate(until, 'date', locale),
    time: formatClock(until),
  };
  return translate(`admin.contests.ranking.link.preview.${form.expiryMode}`, when, { locale });
}
