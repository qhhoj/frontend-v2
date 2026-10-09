import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

/** Which Bit each ticket placement of plan F1 shows; components never name a kind themselves. */
export const TICKET_BITS = {
  /** "Chỉ hiện 200 sự kiện gần nhất". */
  cap: 'staff',
  /** No canned reply exists yet: the quill. */
  cannedEmpty: 'writing',
  /** Tickets wait for the viewer. */
  alertsWaiting: 'staff',
  /** Nothing waits. */
  alertsClear: 'crown',
} as const satisfies Record<string, BitKind | BitMood>;
