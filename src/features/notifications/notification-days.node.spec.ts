import { describe, expect, it } from 'vitest';
import { notificationItem } from '@/test/notification-fixtures';
import { groupByDay } from './notification-days';

/** Local wall-clock instants, so the spec holds in any time zone. */
const at = (day: number, hour: number) => new Date(2026, 9, day, hour).toISOString();
const row = (id: string, day: number, hour: number) =>
  notificationItem({ id, lastActivityAt: at(day, hour) });

describe('groupByDay', () => {
  it('puts the rows of the local today first, then the earlier ones, keeping the server order', () => {
    const now = new Date(2026, 9, 9, 15);
    const groups = groupByDay(
      [row('a', 9, 14), row('b', 9, 0), row('c', 8, 23), row('d', 1, 9)],
      now,
    );
    expect(groups.map((group) => [group.key, group.items.map((item) => item.id)])).toEqual([
      ['today', ['a', 'b']],
      ['earlier', ['c', 'd']],
    ]);
  });

  it('leaves out a group with no row', () => {
    const now = new Date(2026, 9, 9, 15);
    expect(groupByDay([row('c', 8, 23)], now).map((group) => group.key)).toEqual(['earlier']);
    expect(groupByDay([], now)).toEqual([]);
  });
});
