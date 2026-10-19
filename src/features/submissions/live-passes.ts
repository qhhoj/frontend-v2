import { useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import type { FrameSummary } from './frame-summary';
import { fetchScopePage, scopeApiQuery } from './list/submission-scope';
import type { SubmissionScope } from './list/submission-scope';
import type { SubmissionFilters } from './use-submission-filters';

export const FIRST_PAGE = 1;

export interface PassContext {
  /** Whose list it is: the probe for rows above a later page asks the same endpoint. */
  scope: Ref<SubmissionScope>;
  filters: Ref<SubmissionFilters>;
  /** Reads the shown page again and resolves to its rows. */
  refetchRows: () => Promise<SubmissionListItem[] | undefined>;
  shownIds: () => Set<string>;
  addedIds: Ref<ReadonlySet<string>>;
  newCount: Ref<number>;
  announce: (message: string) => void;
  /** Rows that arrived above the viewed page (see `useNewRowBaseline`). */
  rowsAbove: (firstPageTotal: number | undefined, queuedFrames: number) => number;
  /** Changes when the work in flight no longer fits the list: a late answer then writes nothing. */
  currentGeneration: () => number;
}

/** The two things a settled window can do to the list: take new rows in (page 1) or count them (later pages). */
export function createListPasses(context: PassContext) {
  const { filters, newCount, currentGeneration } = context;
  const queryClient = useQueryClient();

  async function applyFirstPage() {
    const before = context.shownIds();
    const startedIn = currentGeneration();
    const fresh = (await context.refetchRows()) ?? [];
    if (startedIn !== currentGeneration()) return;
    const added = fresh.filter((row) => !before.has(row.id)).map((row) => row.id);
    context.addedIds.value = new Set(added);
    if (added.length)
      context.announce(translate('submissions.liveAdded', { count: added.length }, added.length));
  }

  async function applyLaterPage({ queuedFrames, touchedShownRow }: FrameSummary) {
    const startedIn = currentGeneration();
    if (touchedShownRow) await context.refetchRows();
    if (!queuedFrames) return;
    const probe = await fetchScopePage(context.scope.value, {
      ...scopeApiQuery(context.scope.value, filters.value),
      page: FIRST_PAGE,
      pageSize: 1,
    });
    if (startedIn !== currentGeneration()) return;
    const count = context.rowsAbove(probe.meta.total, queuedFrames);
    if (count > newCount.value)
      context.announce(translate('submissions.liveNew', { count }, count));
    newCount.value = count;
  }

  /** One pass over what a settle window collected. */
  async function run(settled: FrameSummary) {
    if (settled.finishedShownRow)
      void queryClient.invalidateQueries({ queryKey: ['submissions', 'stats'] });
    try {
      if (filters.value.page === FIRST_PAGE) await applyFirstPage();
      else await applyLaterPage(settled);
    } catch {
      // A failed read leaves the list as it is; the next frame tries again.
    }
  }

  return { run };
}
