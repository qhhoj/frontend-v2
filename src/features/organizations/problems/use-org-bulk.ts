import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { runBulk } from '@/api/organization-problems.api';
import type { BulkBody, BulkProblemsResult } from '@/api/types/organization-problems';
import { remainingSelection } from './bulk-outcome';
import { orgFailureText } from './org-problem-errors';
import { ARCHIVED_IN_KEY } from './org-problems.queries';

/** The action part of a bulk call; the codes are the current selection. */
export type BulkCommand = Omit<BulkBody, 'codes'>;

/** One bulk call at a time over the ticked codes; done codes leave the selection, a refusal keeps it whole. */
export function useOrgBulk(slug: Ref<string>, selected: Ref<string[]>) {
  const client = useQueryClient();
  const result = ref<BulkProblemsResult | null>(null);
  const mutation = useMutation({
    mutationFn: (body: BulkBody) => runBulk(slug.value, body),
    onSuccess: async (answer) => {
      result.value = answer;
      selected.value = remainingSelection(selected.value, answer);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['organizations', 'problems', slug.value] }),
        client.invalidateQueries({ queryKey: ARCHIVED_IN_KEY }),
      ]);
    },
  });
  function run(command: BulkCommand) {
    if (mutation.isPending.value || selected.value.length === 0) return;
    result.value = null;
    mutation.mutate({ ...command, codes: [...selected.value] });
  }
  const failureText = computed(() =>
    mutation.error.value ? orgFailureText(mutation.error.value) : '',
  );
  const action = computed(() => mutation.variables.value?.action ?? null);
  return { run, result, action, failureText, isPending: mutation.isPending };
}
