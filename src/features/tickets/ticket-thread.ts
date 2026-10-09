import type {
  TicketMessage,
  TicketTimelineEntry,
  TicketTimelineEvent,
  TicketTimelineType,
} from '@/api/types/tickets';

/** @uiOnly one row of the drawn thread (M8C). */
export type ThreadRow =
  | { kind: 'message'; key: string; message: TicketMessage }
  | { kind: 'event'; key: string; event: TicketTimelineEvent }
  | { kind: 'events'; key: string; events: TicketTimelineEvent[] };

const GOOD_TYPES: readonly TicketTimelineType[] = ['marked-good', 'unmarked-good'];
const TYPE_KEYS: Readonly<Record<TicketTimelineType, string>> = {
  closed: 'closed',
  reopened: 'reopened',
  assigned: 'assigned',
  unassigned: 'unassigned',
  'marked-good': 'markedGood',
  'unmarked-good': 'unmarkedGood',
};

/** M8C: "Đóng góp tốt" rows are staff-only; the backend sends them to everyone. */
const isShown = (entry: TicketTimelineEntry, canSeeGood: boolean) =>
  canSeeGood || entry.event === null || !GOOD_TYPES.includes(entry.event.type);

const rowOfRun = (run: TicketTimelineEvent[]): ThreadRow =>
  run.length === 1
    ? { kind: 'event', key: run[0]!.id, event: run[0]! }
    : { kind: 'events', key: run[0]!.id, events: run };

/** Messages one by one; two or more consecutive events fold into one row, a lone event stays a divider. Server order kept. */
export function threadRows(
  timeline: readonly TicketTimelineEntry[],
  canSeeGood: boolean,
): ThreadRow[] {
  const rows: ThreadRow[] = [];
  let run: TicketTimelineEvent[] = [];
  const closeRun = () => {
    if (run.length > 0) rows.push(rowOfRun(run));
    run = [];
  };
  for (const entry of timeline.filter((item) => isShown(item, canSeeGood))) {
    if (entry.event) run.push(entry.event);
    else if (entry.message) {
      closeRun();
      rows.push({ kind: 'message', key: entry.message.id, message: entry.message });
    }
  }
  closeRun();
  return rows;
}

/** The events this viewer sees (the cap check passes `true`: it counts what the ticket holds). */
export const eventCount = (timeline: readonly TicketTimelineEntry[], canSeeGood: boolean) =>
  timeline.filter((entry) => entry.event !== null && isShown(entry, canSeeGood)).length;

/** M8C "Chỉ có sự kiện": the thread ends on a close with nothing written after it. */
export const endsClosed = (rows: readonly ThreadRow[]): boolean => {
  const last = rows.at(-1);
  return last?.kind === 'event' && last.event.type === 'closed';
};

export const eventTextKey = (type: TicketTimelineType) => `ticketTimeline.types.${TYPE_KEYS[type]}`;
