import type { TagColor } from '@/api/types/tag-color';
import type {
  ProblemTag,
  ProblemTagBody,
  ProblemTagChanges,
} from '@/api/types/organization-problems';

/** The tag editor's draft; `slug` is only editable while creating. */
export interface TagForm {
  slug: string;
  name: string;
  color: TagColor;
}
const TAG_SLUG_PATTERN = /^[a-z0-9-]{1,20}$/;
const NAME_MAX_LENGTH = 40;

export const emptyTagForm = (): TagForm => ({ slug: '', name: '', color: 'tag-1' });
export const tagFormOf = (tag: ProblemTag): TagForm => ({
  slug: tag.slug,
  name: tag.name,
  color: tag.color,
});

/** The same limits as the backend DTO, so a refused draft is never sent; values are i18n keys. */
export function tagFormErrors(form: TagForm, isNew: boolean): { slug?: string; name?: string } {
  const name = form.name.trim();
  return {
    ...(isNew && !TAG_SLUG_PATTERN.test(form.slug) ? { slug: 'orgProblems.tags.errors.slug' } : {}),
    ...(name.length === 0 || name.length > NAME_MAX_LENGTH
      ? { name: 'orgProblems.tags.errors.name' }
      : {}),
  };
}

export const createBodyOf = (form: TagForm): ProblemTagBody => ({
  slug: form.slug,
  name: form.name.trim(),
  color: form.color,
});

/** The slug is the tag's identity: an edit never sends it. */
export const changesOf = (form: TagForm): ProblemTagChanges => ({
  name: form.name.trim(),
  color: form.color,
});
