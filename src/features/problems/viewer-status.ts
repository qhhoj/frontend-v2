import type { ChipTone } from '@/components/ui/Chip.vue';
import type { ViewerStatus } from '@/api/types/problems';

/** The viewer's standing on a problem, as the facts card (text colour) and the limit strip (chip tone) show it. */
const VIEWER_STATUS = {
  solved: { key: 'problems.solved', text: 'text-verdict-ac', chip: 'success' },
  attempted: { key: 'problems.attempted', text: 'text-verdict-tle', chip: 'warning' },
  untried: { key: 'problem.rail.facts.untried', text: 'text-muted', chip: 'neutral' },
} as const satisfies Record<string, { key: string; text: string; chip: ChipTone }>;

/** No status yet reads as "not tried". */
export const viewerStatusOf = (status: ViewerStatus | undefined) =>
  VIEWER_STATUS[status ?? 'untried'];
