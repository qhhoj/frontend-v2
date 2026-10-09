import type { ContestTag, ContestTagBody, ContestTagPatch } from '@/api/types/contest-tags';
import type { TagColor } from '@/api/types/tag-color';
import { isTagSlug } from '@/features/contests/tag-chips';
import { translate } from '@/i18n';
import type { FieldErrors } from '../ui/admin-errors';

/** The editor's fields; the slug is fixed once the tag exists. */
export interface ContestTagForm {
  slug: string;
  name: string;
  color: TagColor;
  description: string;
  order: number;
}

/** backend `CreateContestTagDto`: name 1..40, description ≤ 200, order -1000..1000. */
const NAME_MAX = 40;
const DESCRIPTION_MAX = 200;
const ORDER_LIMIT = 1000;

export const emptyTagForm = (): ContestTagForm => ({
  slug: '',
  name: '',
  color: 'tag-1',
  description: '',
  order: 0,
});

export const tagFormOf = (tag: ContestTag): ContestTagForm => ({
  slug: tag.slug,
  name: tag.name,
  color: tag.color,
  description: tag.description,
  order: tag.order,
});

const message = (key: string) => translate(`admin.contestTags.errors.${key}`);
const isNameValid = (name: string) => name.length > 0 && name.length <= NAME_MAX;
const isOrderValid = (order: number) => Number.isInteger(order) && Math.abs(order) <= ORDER_LIMIT;

export function checkTagForm(form: ContestTagForm, isCreate: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (isCreate && !isTagSlug(form.slug)) errors.slug = message('slug');
  if (!isNameValid(form.name.trim())) errors.name = message('name');
  if (form.description.trim().length > DESCRIPTION_MAX) errors.description = message('description');
  if (!isOrderValid(form.order)) errors.order = message('order');
  return errors;
}

export const toTagBody = (form: ContestTagForm): ContestTagBody => ({
  slug: form.slug,
  name: form.name.trim(),
  color: form.color,
  description: form.description.trim(),
  order: form.order,
});

export function toTagPatch(before: ContestTag, form: ContestTagForm): ContestTagPatch {
  const after = toTagBody(form);
  const patch: ContestTagPatch = {};
  if (after.name !== before.name) patch.name = after.name;
  if (after.color !== before.color) patch.color = after.color;
  if (after.description !== before.description) patch.description = after.description;
  if (after.order !== before.order) patch.order = after.order;
  return patch;
}
