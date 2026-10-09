import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';
import type { StateKind } from '@/mascot/state-bits';

/**
 * REPLACEABLE HOOK: the Bit of every state of the organization "Bài tập" and "Hạn mức" tabs and of the problem page's
 * archive notice (plan VNOI F4). Page-sized states name a `StateKind` (drawn by StatePanel); inline notices name a kind.
 */
export const ORG_BITS = {
  listEmpty: 'empty',
  forbidden: 'forbidden',
  filteredEmpty: 'asleep',
  memberReadOnly: 'community',
  bulkDone: 'crown',
  bulkPartial: 'sweat',
  bulkRefused: 'sweat',
  tagsEmpty: 'writing',
  archivedNotice: 'asleep',
  quotaHealthy: 'rankUp',
  quotaNear: 'sweat',
  quotaBlocked: 'security',
  ledgerEmpty: 'asleep',
} as const satisfies Record<string, StateKind | BitKind | BitMood>;
