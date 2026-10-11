import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { decideJoinRequest } from '@/api/organizations.api';
import type { JoinRequest } from '@/api/types/organizations';
import { invalidateAfterDecision } from './join-request-decision';

export interface BulkOutcome {
  done: number;
  failed: number;
  /** The first refusal, shown by its code (`organization_full` once the seats run out). */
  firstFailure: unknown;
}

/**
 * Legacy approval formset, one request at a time: approvals of one organization queue on its lock (parallel ones would be
 * refused as `busy`), and a refusal (a full organization, a request someone else decided) never stops the rest.
 */
export async function decideInTurn<Item>(
  items: readonly Item[],
  decide: (item: Item) => Promise<unknown>,
): Promise<BulkOutcome> {
  const outcome: BulkOutcome = { done: 0, failed: 0, firstFailure: null };
  for (const item of items) {
    try {
      await decide(item);
      outcome.done += 1;
    } catch (error) {
      // A programming error (not an ApiError) must surface, not become a refusal count.
      if (!(error instanceof ApiError)) throw error;
      outcome.failed += 1;
      outcome.firstFailure ??= error;
    }
  }
  return outcome;
}

/** The ticked requests of the visible page; a page change or a refresh drops ticks on rows that are gone. */
export function useJoinRequestSelection(rows: () => readonly JoinRequest[]) {
  const ticked = ref<Set<string>>(new Set());
  const pending = computed(() => rows().filter((row) => row.state === 'P'));
  const selected = computed(() => pending.value.filter((row) => ticked.value.has(row.id)));
  const isAllTicked = computed(
    () => pending.value.length > 0 && selected.value.length === pending.value.length,
  );

  function toggle(id: string) {
    const next = new Set(ticked.value);
    if (!next.delete(id)) next.add(id);
    ticked.value = next;
  }
  function toggleAll() {
    ticked.value = isAllTicked.value ? new Set() : new Set(pending.value.map((row) => row.id));
  }
  const clear = () => (ticked.value = new Set());

  const hasPending = computed(() => pending.value.length > 0);
  return { ticked, selected, isAllTicked, hasPending, toggle, toggleAll, clear };
}

/** Decides every selected request through its own organization's endpoint. */
export const decideSelected = (requests: readonly JoinRequest[], next: 'A' | 'R') =>
  decideInTurn(requests, (request) =>
    decideJoinRequest(request.organizationSlug, request.id, next),
  );

/** A panel's bulk decisions: the selection, one run at a time, its outcome, and the refresh of every organization touched. */
export function useBulkDecisions(rows: () => readonly JoinRequest[]) {
  const queryClient = useQueryClient();
  const selection = useJoinRequestSelection(rows);
  const isBusy = ref(false);
  const outcome = ref<BulkOutcome | null>(null);

  async function decide(next: 'A' | 'R') {
    const requests = [...selection.selected.value];
    if (isBusy.value || requests.length === 0) return;
    isBusy.value = true;
    outcome.value = null;
    try {
      outcome.value = await decideSelected(requests, next);
    } finally {
      selection.clear();
      isBusy.value = false;
      const slugs = [...new Set(requests.map((request) => request.organizationSlug))];
      await Promise.allSettled(slugs.map((slug) => invalidateAfterDecision(queryClient, slug)));
    }
  }

  return { ...selection, isBusy, outcome, decide };
}
