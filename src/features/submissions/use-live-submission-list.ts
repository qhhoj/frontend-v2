import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useLiveStream } from '@/api/events';
import type { SubmissionFeedEvent, SubmissionListItem } from '@/api/types/submissions';
import { createSettleWindow } from '@/lib/settle-window';
import { useViewerId } from '@/stores/use-viewer-id';
import { createFrameSummary } from './frame-summary';
import { useAnnouncer, useListFilterKey, useNewRowBaseline } from './live-list-state';
import { createListPasses } from './live-passes';
import type { SubmissionScope } from './list/submission-scope';
import type { SubmissionFilters } from './use-submission-filters';

/** Frames of a burst are read together: the first one starts the window, the pass runs when it ends. */
export const LIVE_SETTLE_MS = 3000;

interface LiveSubmissionListOptions {
  scope: Ref<SubmissionScope>;
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

type FrameSummaryTally = ReturnType<typeof createFrameSummary>;

/**
 * The public feed while `enabled`: a frame that matters starts or joins a settle window, whose end runs `pass` once.
 * `forgetPendingWork` drops the tally and the window; a closed stream does it too.
 */
function useSettledFeed(
  enabled: Ref<boolean>,
  frames: FrameSummaryTally,
  hooks: { pass: () => Promise<void>; onForget: () => void },
) {
  const settler = createSettleWindow(LIVE_SETTLE_MS, hooks.pass, 'fixed');
  const forgetPendingWork = () => {
    hooks.onForget();
    frames.clear();
    settler.cancel();
  };
  const onFrame = (frame: SubmissionFeedEvent) => frames.add(frame) && settler.add();
  const viewer = useViewerId();
  /** Reopened for another account: the server authorised the feed for the viewer who opened it. */
  const target = () =>
    enabled.value ? { route: '/events/submissions' as const, viewer: viewer.value } : null;
  const feed = useLiveStream(target, {
    frames: { queued: onFrame, processing: onFrame, 'grading-begin': onFrame, done: onFrame },
    onClose: forgetPendingWork,
  });
  return { feed, forgetPendingWork };
}

/**
 * Keeps the submission list current from the public feed (it only says ids and status, so a pass reads the list).
 * Page 1 takes new rows in place; a later page only learns how many rows arrived above it (`newCount`).
 */
export function useLiveSubmissionList(options: LiveSubmissionListOptions) {
  const { filters, rows } = options;
  const announcer = useAnnouncer();
  const baseline = useNewRowBaseline(filters, options.total);
  const addedIds = ref<ReadonlySet<string>>(new Set());
  const shownIds = () => new Set(rows.value.map((row) => row.id));
  const frames = createFrameSummary((id) => shownIds().has(id));
  let generation = 0;
  const passes = createListPasses({
    ...options,
    shownIds,
    addedIds,
    newCount: baseline.newCount,
    announce: (message) => void announcer.announce(message),
    rowsAbove: (firstPageTotal, queuedFrames) => baseline.rowsAbove(firstPageTotal, queuedFrames),
    currentGeneration: () => generation,
  });

  const { feed, forgetPendingWork } = useSettledFeed(options.enabled, frames, {
    pass: () => passes.run(frames.take()),
    onForget: () => (generation += 1),
  });
  /** A new filter is a new list: what was counted for the old one means nothing. */
  watch(useListFilterKey(filters), () => {
    forgetPendingWork();
    baseline.reset();
  });

  return {
    newCount: baseline.newCount,
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
