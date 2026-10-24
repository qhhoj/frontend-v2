import { translate } from '@/i18n';

/** The wait in words: seconds under a minute, whole minutes (rounded up) under an hour, else hours and minutes. */
export function formatWait(seconds: number): string {
  if (seconds < 60) return translate('admin.ui.duration.seconds', { count: seconds });
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return translate('admin.ui.duration.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0
    ? translate('admin.ui.duration.hours', { count: hours })
    : translate('admin.ui.duration.hoursMinutes', { hours, minutes: restMinutes });
}
