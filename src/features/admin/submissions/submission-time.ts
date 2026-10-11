import { INTL_LOCALES } from '@/lib/format';
import type { Locale } from '@/i18n';
import { SITE_TIME_ZONE } from '../ui/form/site-time';

/** `10/11 21:16` (en) or `11/10 21:16` (vi): the day and month plus a 24-hour time, in the site's time zone. */
export function formatShortSiteTime(date: string, locale: Locale): string {
  const intl = INTL_LOCALES[locale];
  const instant = new Date(date);
  const day = new Intl.DateTimeFormat(intl, {
    day: '2-digit',
    month: '2-digit',
    timeZone: SITE_TIME_ZONE,
  }).format(instant);
  const time = new Intl.DateTimeFormat(intl, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: SITE_TIME_ZONE,
  }).format(instant);
  return `${day} ${time}`;
}
