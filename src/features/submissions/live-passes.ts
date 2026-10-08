import type { Ref } from 'vue';
import { fetchSubmissions } from '@/api/submissions.api';
import type { SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import type { FrameSummary } from './live-feed';
import { submissionListApiQuery } from './submissions.queries';
import type { SubmissionFilters } from './use-submission-filters';

export const FIRST_PAGE = 1;

export interface PassContext {
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
    const probe = await fetchSubmissions({
      ...submissionListApiQuery(filters.value),
      page: FIRST_PAGE,
      pageSize: 1,
    });
    if (startedIn !== currentGeneration()) return;
    const count = context.rowsAbove(probe.meta.total, queuedFrames);
    if (count > newCount.value)
      context.announce(translate('submissions.liveNew', { count }, count));
    newCount.value = count;
  }

  return { applyFirstPage, applyLaterPage };
}
