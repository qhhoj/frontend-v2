import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

/**
 * Which Bit each notification and official-mode placement shows (spec rule "Bit wherever possible and fitting").
 * A placement names a kind here once; components never name a kind themselves.
 */
export const NOTIFICATION_BITS = {
  /** The envelope beside the `/notifications` heading. */
  header: 'envelope',
  /** "Chưa có thông báo nào": asleep in the nightcap. */
  empty: 'asleep',
  /** After "Đánh dấu tất cả đã đọc". */
  allRead: 'crown',
  /** A notification whose target is gone. */
  stale: 'sweat',
  /** The drawer's and the page's load error card. */
  loadFailed: 'sweat',
  /** "Đọc hết" refused (429): the drawer and the page both say so. */
  readAllFailed: 'sweat',
  /** The high-priority banner. */
  banner: 'envelope',
  /** Viewing as another user: nothing is marked read. */
  impersonating: 'staff',
  /** Official mode: the banner and every locked control. */
  locked: 'security',
} as const satisfies Record<string, BitKind | BitMood>;
