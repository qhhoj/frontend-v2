import type { ViewerStatus } from '@/api/types/problems';
import type { VerdictTone } from '@/lib/verdicts';

/**
 * The viewer's standing on a problem as a lamp (kit `Lamp`) and its words: solved is the accepted green, tried and not
 * solved the wrong-answer red, not tried an unlit ring. The API does not say "partly solved", so there is no lime lamp here.
 */
const VIEWER_LAMP = {
  solved: { tone: 'ac', labelKey: 'problems.solved' },
  attempted: { tone: 'wa', labelKey: 'problems.attemptedLong' },
  untried: { tone: 'none', labelKey: 'problems.notTried' },
} as const satisfies Record<string, { tone: VerdictTone | 'none'; labelKey: string }>;

/** No status yet reads as "not tried". */
export const viewerLampOf = (status: ViewerStatus | undefined) => VIEWER_LAMP[status ?? 'untried'];
