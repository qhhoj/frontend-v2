import type { OrganizationUsage, QuotaMeter } from '@/api/types/organization-usage';
import type { Locale } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { meterPercent } from '@/lib/quota';

type MeterName = 'credits' | 'storage';
export interface QuotaNoticeState {
  kind: 'healthy' | 'near' | 'blocked';
  meter: MeterName | null;
  percent: number;
}
const METERS: MeterName[] = ['credits', 'storage'];
const KNOWN_REASONS = ['problem', 'contest', 'upload', 'refund'];

const firstMeter = (usage: OrganizationUsage, isHit: (meter: QuotaMeter) => boolean) =>
  METERS.find((name) => isHit(usage[name])) ?? null;

/** A meter that takes nothing more: over by the server flag, or used up to its limit (a limit of 0 is full from the start, whatever the flags say). */
const isExhausted = (meter: QuotaMeter): boolean => meter.isOver || meter.used >= meter.limit;

/** Unlimited organizations are always healthy. Blocked: enforce mode and a meter exhausted (limit 0 included); near: any meter at 80 % or more (over included in warn mode). */
export function quotaNoticeOf(usage: OrganizationUsage): QuotaNoticeState {
  if (usage.unlimited) return { kind: 'healthy', meter: null, percent: 0 };
  const over = firstMeter(usage, (meter) => meter.isOver);
  const full = firstMeter(usage, isExhausted);
  if (usage.enforcing && full)
    return { kind: 'blocked', meter: full, percent: meterPercent(usage[full]).percent };
  const near = over ?? firstMeter(usage, (meter) => meter.isNearLimit);
  if (near) return { kind: 'near', meter: near, percent: meterPercent(usage[near]).percent };
  return { kind: 'healthy', meter: null, percent: 0 };
}

/** The ledger stores spends as positive amounts and refunds as negative: shown from the organization's side. */
export const ledgerAmountText = (amount: number, locale: Locale): string =>
  `${amount > 0 ? '−' : '+'}${formatNumber(Math.abs(amount), locale)}`;

export const ledgerReasonKey = (reason: string): string =>
  `orgQuota.reasons.${KNOWN_REASONS.includes(reason) ? reason : 'other'}`;
