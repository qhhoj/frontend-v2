import type { TagColor } from '@/api/types/tag-color';
import { TAG_COLORS, TAG_COLOR_CLASSES } from '@/features/contests/tag-colors';

/** Organization problem tags share the contest tag palette (backend enum `TagColor`, F3 tokens `tag-1`..`tag-8`). */
export const ORGANIZATION_TAG_COLORS = TAG_COLORS;
/** Chip classes: `text-tag-N` on its tint `bg-tag-N-bg`. */
export const TAG_CHIP_CLASSES = TAG_COLOR_CLASSES;

/** The small solid dot of a filter chip: the text token as a ground (the tint is too faint for a dot). Static so Tailwind sees every class. */
export const TAG_DOT_CLASSES: Record<TagColor, string> = {
  'tag-1': 'bg-tag-1',
  'tag-2': 'bg-tag-2',
  'tag-3': 'bg-tag-3',
  'tag-4': 'bg-tag-4',
  'tag-5': 'bg-tag-5',
  'tag-6': 'bg-tag-6',
  'tag-7': 'bg-tag-7',
  'tag-8': 'bg-tag-8',
};
