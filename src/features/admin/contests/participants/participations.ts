import type { Participation } from '@/api/types/contest-editing';
import type { Locale } from '@/i18n';
import { translate } from '@/i18n';
import { formatInZone } from '../../ui/form/site-time';

/** The label key of a participation: live (0), spectating (-1) or the number of a virtual one (n). */
export function participationKindKey(virtual: number): {
  key: string;
  params?: { number: number };
} {
  if (virtual === 0) return { key: 'admin.contests.participants.kinds.live' };
  if (virtual < 0) return { key: 'admin.contests.participants.kinds.spectate' };
  return { key: 'admin.contests.participants.kinds.virtual', params: { number: virtual } };
}

/** icpc counts the penalty in minutes, every other format in seconds (as `formatCumtime` of the ranking). */
export function formatPenalty(cumtime: number, formatName: string, locale: Locale): string {
  const seconds = formatName === 'icpc' ? cumtime * 60 : cumtime;
  if (seconds <= 0) return '–';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return translate('admin.contests.participants.penalty', { hours, minutes }, { locale });
}

/** "bản 3 · 08/10/2026 12:58" (site time), or a dash for a row that accepted nothing (no rules then, or a spectator). */
export function rulesAcceptanceText(row: Participation, locale: Locale): string {
  if (row.rulesAcceptedAt === null || row.rulesAcceptedRevision === null) return '—';
  return translate(
    'admin.contestRules.accepted',
    { revision: row.rulesAcceptedRevision, time: formatInZone(row.rulesAcceptedAt) },
    { locale },
  );
}
