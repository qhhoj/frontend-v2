import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import {
  createProblemTag,
  deleteProblemTag,
  updateProblemTag,
} from '@/api/organization-problems.api';
import { changesOf, createBodyOf } from './org-tag-form';
import type { TagForm } from './org-tag-form';

/** `tagSlug` null: create. */
interface TagSave {
  tagSlug: string | null;
  form: TagForm;
}

/** Catalogue writes; each refreshes the catalogue and this organization's rows (their chips show tags). */
export function useOrgTagActions(slug: Ref<string>) {
  const client = useQueryClient();
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['organizations', 'problem-tags', slug.value] }),
      client.invalidateQueries({ queryKey: ['organizations', 'problems', slug.value] }),
    ]);
  const save = useMutation({
    mutationFn: (command: TagSave) =>
      command.tagSlug === null
        ? createProblemTag(slug.value, createBodyOf(command.form))
        : updateProblemTag(slug.value, command.tagSlug, changesOf(command.form)),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (tagSlug: string) => deleteProblemTag(slug.value, tagSlug),
    onSuccess: refresh,
  });
  return { save, remove };
}
