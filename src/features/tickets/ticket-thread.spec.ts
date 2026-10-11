import { describe, expect, it } from 'vitest';
import type { TicketTimelineType } from '@/api/types/tickets';
import { eventEntry, messageEntry, ticketMessage, timelineEvent } from '@/test/community-fixtures';
import { endsClosed, threadRows } from './ticket-thread';

const message = (id: string) => messageEntry(ticketMessage({ id }));
const event = (id: string, type: TicketTimelineType = 'closed') =>
  eventEntry(timelineEvent({ id, type }));
const shape = (rows: ReturnType<typeof threadRows>) =>
  rows.map((row) =>
    row.kind === 'events'
      ? `events:${row.events.map((item) => item.id).join('+')}`
      : `${row.kind}:${row.key}`,
  );

describe('threadRows', () => {
  it('folds a run of consecutive events into one row and keeps a lone event as a divider, in server order', () => {
    const rows = threadRows(
      [
        message('m1'),
        event('e1', 'assigned'),
        message('m2'),
        event('e2', 'unassigned'),
        event('e3', 'assigned'),
        message('m3'),
        event('e4'),
      ],
      true,
    );
    expect(shape(rows)).toEqual([
      'message:m1',
      'event:e1',
      'message:m2',
      'events:e2+e3',
      'message:m3',
      'event:e4',
    ]);
  });

  it('hides good-contribution events from a viewer who cannot mark them, and refolds what is left', () => {
    const timeline = [
      message('m1'),
      event('e1', 'marked-good'),
      event('e2', 'closed'),
      message('m2'),
    ];
    expect(shape(threadRows(timeline, false))).toEqual(['message:m1', 'event:e2', 'message:m2']);
    expect(shape(threadRows(timeline, true))).toEqual(['message:m1', 'events:e1+e2', 'message:m2']);
  });

  it('knows a thread ends on a close with no message after it', () => {
    expect(endsClosed(threadRows([message('m1'), event('e1')], true))).toBe(true);
    expect(endsClosed(threadRows([message('m1'), event('e1'), message('m2')], true))).toBe(false);
    expect(endsClosed(threadRows([message('m1'), event('e1', 'assigned')], true))).toBe(false);
    expect(endsClosed([])).toBe(false);
  });
});
