import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { archiveProblem, setProblemTags, unarchiveProblem } from '@/api/organization-problems.api';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import { orgFailureText } from './org-problem-errors';
import { ARCHIVED_IN_KEY } from './org-problems.queries';

interface TagCommand {
  code: string;
  tagIds: string[];
}

/** Per-row writes of the "Bài tập" tab. Each refreshes this organization's lists and every archive notice. */
export function useOrgProblemActions(slug: Ref<string>) {
  const client = useQueryClient();
  const invalidateLists = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['organizations', 'problems', slug.value] }),
      client.invalidateQueries({ queryKey: ARCHIVED_IN_KEY }),
    ]);
  const tagsMutation = useMutation({
    mutationFn: (command: TagCommand) => setProblemTags(slug.value, command.code, command.tagIds),
    onSuccess: invalidateLists,
  });
  const archiveMutation = useMutation({
    mutationFn: (row: OrganizationProblem) =>
      row.isArchived
        ? unarchiveProblem(slug.value, row.code)
        : archiveProblem(slug.value, row.code),
    onSuccess: invalidateLists,
  });
  const busyCode = computed(() =>
    archiveMutation.isPending.value ? (archiveMutation.variables.value?.code ?? null) : null,
  );
  /** A second press while one archive write is in flight sends nothing. */
  function toggleArchive(row: OrganizationProblem) {
    if (archiveMutation.isPending.value) return;
    archiveMutation.mutate(row);
  }
  const failureText = computed(() =>
    archiveMutation.error.value ? orgFailureText(archiveMutation.error.value) : '',
  );
  return { tagsMutation, toggleArchive, busyCode, failureText, invalidateLists };
}
