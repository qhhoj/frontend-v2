import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { createFrameSummary, createSettler, useFeedStream } from './live-feed';
import { useAnnouncer, useListFilterKey, useNewRowBaseline } from './live-list-state';
import { createListPasses } from './live-passes';
import type { SubmissionFilters } from './use-submission-filters';

/** Frames of a burst are read together: the first one starts the window, the pass runs when it ends. */
export const LIVE_SETTLE_MS = 3000;

interface LiveSubmissionListOptions {
  filters: Ref<SubmissionFilters>;
  /** The rows shown now. */
  rows: Ref<SubmissionListItem[]>;
  /** `meta.total` of the list shown now; undefined while it is unknown or still the previous list's. */
  total: Ref<number | undefined>;
  /** Live updates is on. */
  enabled: Ref<boolean>;
  /** Reads the shown page again and resolves to its rows. */
  refetchRows: () => Promise<SubmissionListItem[] | undefined>;
  goToFirstPage: () => void;
}

/**
 * Keeps the submission list current from the public feed (it only says ids and status, so a pass reads the list).
 * Page 1 takes new rows in place; a later page only learns how many rows arrived above it (`newCount`).
 */
export function useLiveSubmissionList(options: LiveSubmissionListOptions) {
  const { filters, rows } = options;
  const announcer = useAnnouncer();
  const baseline = useNewRowBaseline(filters, options.total);
  const { newCount } = baseline;
  const addedIds = ref<ReadonlySet<string>>(new Set());
  const shownIds = () => new Set(rows.value.map((row) => row.id));
  const frames = createFrameSummary((id) => shownIds().has(id));
  let generation = 0;
  const passes = createListPasses({
    ...options,
    shownIds,
    addedIds,
    newCount,
    announce: (message) => void announcer.announce(message),
    rowsAbove: (firstPageTotal, queuedFrames) => baseline.rowsAbove(firstPageTotal, queuedFrames),
    currentGeneration: () => generation,
  });

  const settler = createSettler(LIVE_SETTLE_MS, () => passes.run(frames.take()));
  const forgetPendingWork = () => {
    generation += 1;
    frames.clear();
    settler.cancel();
  };
  const feed = useFeedStream({
    enabled: options.enabled,
    onFrame: (frame) => frames.add(frame) && settler.poke(),
    onStop: forgetPendingWork,
  });
  /** A new filter is a new list: what was counted for the old one means nothing. */
  watch(useListFilterKey(filters), () => {
    forgetPendingWork();
    baseline.reset();
  });

  return {
    newCount,
    announcement: announcer.text,
    addedIds,
    paused: feed.paused,
    showNew() {
      baseline.reset();
      options.goToFirstPage();
    },
    reconnect() {
      feed.reconnect();
      void options.refetchRows();
    },
  };
}
