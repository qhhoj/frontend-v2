import { computed, onScopeDispose, ref, watch } from 'vue';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useInvalidateNotificationLists, useUnreadCountQuery } from './notifications.queries';
import { useNotificationStream } from './use-notification-stream';

const BADGE_MAX = 99;
/** The unread count on a badge: empty at 0, capped at "99+". */
export const unreadBadge = (count: number, locale: Locale): string => {
  if (count <= 0) return '';
  return count > BADGE_MAX ? `${BADGE_MAX}+` : formatNumber(count, locale);
};

/** The gap between emptying and refilling the region: shorter than a frame and browsers merge the two, so an identical text goes unread. */
const REANNOUNCE_GAP_MS = 100;

/**
 * What the page hears about notifications, whichever control shows them (the bell from `md`, the menu sheet on a phone):
 * the tab's live stream, the unread count, and a polite "2 thông báo mới" when the count rises (counts only, never per
 * row). Mounted once, by the header.
 */
export function useNotificationAlerts() {
  useNotificationStream();
  const countQuery = useUnreadCountQuery();
  const invalidateLists = useInvalidateNotificationLists();
  const arrivedText = ref('');
  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  /** Cleared first, so two identical rises ("1 thông báo mới" twice) still change the region and are read again. */
  function announceArrivals(gained: number) {
    clearTimeout(announceTimer);
    arrivedText.value = '';
    if (gained > 0)
      announceTimer = setTimeout(
        () => (arrivedText.value = translate('notifications.arrived', { count: gained })),
        REANNOUNCE_GAP_MS,
      );
  }
  onScopeDispose(() => clearTimeout(announceTimer));
  watch(
    () => countQuery.data.value?.count,
    (count, before) => {
      const hasRisen = count !== undefined && before !== undefined && count > before;
      announceArrivals(hasRisen ? count - before : 0);
      // Contest announcements are `high` and send no nudge (B1): only the polled count tells the banner and the lists.
      if (hasRisen) void invalidateLists();
    },
  );
  return { unread: computed(() => countQuery.data.value?.count ?? 0), arrivedText };
}
