import type { ContestTag } from '@/api/types/contest-tags';
import type { TagColor } from '@/api/types/tag-color';
import { NEUTRAL_TAG_CLASS, TAG_COLOR_CLASSES } from './tag-colors';

/** backend `CONTEST_TAG_PATTERN` (contest.schema.ts): a malformed `?tag=` would be a 400, so it is never sent. */
export const CONTEST_TAG_PATTERN = /^[a-z0-9-]{1,20}$/;
export const isTagSlug = (text: string): boolean => CONTEST_TAG_PATTERN.test(text);

export interface TagChipView {
  slug: string;
  label: string;
  /** Null for a slug the catalogue does not hold. */
  color: TagColor | null;
  colorClass: string;
}

export const catalogueBySlug = (tags: readonly ContestTag[]): ReadonlyMap<string, ContestTag> =>
  new Map(tags.map((tag) => [tag.slug, tag]));

export function tagChipOf(slug: string, catalogue: ReadonlyMap<string, ContestTag>): TagChipView {
  const tag = catalogue.get(slug);
  if (!tag) return { slug, label: slug, color: null, colorClass: NEUTRAL_TAG_CLASS };
  return { slug, label: tag.name, color: tag.color, colorClass: TAG_COLOR_CLASSES[tag.color] };
}

export type TagFilterState = 'none' | 'applied' | 'unknown';

/** What the list does with the address's tag: nothing, send it, or show everything because the catalogue has no such tag. Without a catalogue (still loading or failed) the tag is sent. */
export function tagFilterState(
  tag: string | null,
  catalogue: ReadonlyMap<string, ContestTag> | undefined,
): TagFilterState {
  if (tag === null) return 'none';
  if (!catalogue) return 'applied';
  return catalogue.has(tag) ? 'applied' : 'unknown';
}
