import type { Locale } from '@/i18n';
import { translate } from '@/i18n';

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
