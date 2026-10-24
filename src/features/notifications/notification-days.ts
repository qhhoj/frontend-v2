import type { NotificationItem } from '@/api/types/notifications';

export type DayGroupKey = 'today' | 'earlier';
export interface DayGroup {
  key: DayGroupKey;
  items: NotificationItem[];
}

const isSameLocalDay = (first: Date, second: Date) =>
  first.toDateString() === second.toDateString();

/** "Hôm nay" then "Trước đó", by the viewer's local day of the last activity; server order kept, empty groups left out. */
export function groupByDay(items: readonly NotificationItem[], now: Date): DayGroup[] {
  const isToday = (item: NotificationItem) => isSameLocalDay(new Date(item.lastActivityAt), now);
  const groups: DayGroup[] = [
    { key: 'today', items: items.filter(isToday) },
    { key: 'earlier', items: items.filter((item) => !isToday(item)) },
  ];
  return groups.filter((group) => group.items.length > 0);
}
