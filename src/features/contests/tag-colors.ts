import type { TagColor } from '@/api/types/contest-tags';

/** Literal class strings (Tailwind only generates classes it can read): text and tint of each tag token. */
export const TAG_COLOR_CLASSES: Record<TagColor, string> = {
  'tag-1': 'border-transparent bg-tag-1-bg text-tag-1',
  'tag-2': 'border-transparent bg-tag-2-bg text-tag-2',
  'tag-3': 'border-transparent bg-tag-3-bg text-tag-3',
  'tag-4': 'border-transparent bg-tag-4-bg text-tag-4',
  'tag-5': 'border-transparent bg-tag-5-bg text-tag-5',
  'tag-6': 'border-transparent bg-tag-6-bg text-tag-6',
  'tag-7': 'border-transparent bg-tag-7-bg text-tag-7',
  'tag-8': 'border-transparent bg-tag-8-bg text-tag-8',
};
/** A slug without a catalogue entry (legacy, or a deleted tag): the plain chip. */
export const NEUTRAL_TAG_CLASS = 'border-line text-muted';
export const TAG_COLORS = Object.keys(TAG_COLOR_CLASSES) as TagColor[];

/** The colour of the `index`-th item of a sequence (balloon problem swatches): the eight tag colours, cycling. */
export const tagColorAt = (index: number): TagColor =>
  TAG_COLORS[((index % TAG_COLORS.length) + TAG_COLORS.length) % TAG_COLORS.length]!;
