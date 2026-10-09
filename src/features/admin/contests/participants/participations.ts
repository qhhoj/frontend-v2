import type { Participation } from '@/api/types/contest-editing';
import type { Locale } from '@/i18n';
import { translate } from '@/i18n';
import { formatDateTime } from '@/lib/format';

/** The label key of a participation: live (0), spectating (-1) or the number of a virtual one (n). */
export function participationKindKey(virtual: number): {
  key: string;
  params?: { number: number };
} {
  if (virtual === 0) return { key: 'admin.contests.participants.kinds.live' };
  if (virtual < 0) return { key: 'admin.contests.participants.kinds.spectate' };
  return { key: 'admin.contests.participants.kinds.virtual', params: { number: virtual } };
}

export function formatPenalty(seconds: number, locale: Locale): string {
  if (seconds <= 0) return '–';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return translate('admin.contests.participants.penalty', { hours, minutes }, { locale });
}

/** "bản 3 · 08/10/2026 12:58", or a dash for a row that accepted nothing (no rules then, or a spectator). */
export function rulesAcceptanceText(row: Participation, locale: Locale): string {
  if (row.rulesAcceptedAt === null || row.rulesAcceptedRevision === null) return '—';
  return translate(
    'admin.contestRules.accepted',
    { revision: row.rulesAcceptedRevision, time: formatDateTime(row.rulesAcceptedAt, locale) },
    { locale },
  );
}
