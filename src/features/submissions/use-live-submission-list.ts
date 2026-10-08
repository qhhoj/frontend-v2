import { useQueryClient } from '@tanstack/vue-query';
import { computed, onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { fetchSubmissions } from '@/api/submissions.api';
import { openEventStream } from '@/api/events';
import type { EventStream } from '@/api/events';
import type { SubmissionFeedEvent, SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import { submissionListApiQuery } from './submissions.queries';
import type { SubmissionFilters } from './use-submission-filters';

/** Frames of a burst are read together: the first one starts the window, the pass runs when it ends. */
export const LIVE_SETTLE_MS = 3000;
const FEED_PATH = '/events/submissions';
const FEED_FRAME_TYPES: SubmissionFeedEvent['type'][] = [
  'queued',
  'processing',
  'grading-begin',
  'done',
];
const FIRST_PAGE = 1;

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

/** What the frames of one settle window said. */
interface WindowSummary {
  queuedFrames: number;
  touchedShownRow: boolean;
  finishedShownRow: boolean;
}
const emptySummary = (): WindowSummary => ({
  queuedFrames: 0,
  touchedShownRow: false,
  finishedShownRow: false,
});

/** Collects pokes for `windowMs`, then runs `pass` once. Pokes during a running pass join the next window. */
function createSettler(windowMs: number, pass: () => Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    poke() {
      timer ??= setTimeout(async () => {
        timer = undefined;
        await pass();
      }, windowMs);
    },
    cancel() {
      clearTimeout(timer);
      timer = undefined;
    },
  };
}

/**
 * Keeps the submission list current from the public feed (it only says ids and status, so a pass reads the list).
 * Page 1 takes new rows in place; a later page only learns how many rows arrived above it (`newCount`).
 */
export function useLiveSubmissionList(options: LiveSubmissionListOptions) {
  const { filters, rows, total, enabled } = options;
  const queryClient = useQueryClient();
  const newCount = ref(0);
  const announcement = ref('');
  const addedIds = ref<ReadonlySet<string>>(new Set());
  const paused = ref(false);
  /** Reopens the stream: `reconnect` bumps it. */
  const connectionAttempt = ref(0);
  /** `total` when the viewed list was last whole at its top; the pill counts growth from it. */
  let baselineTotal: number | undefined;
  /** Without a total the pill can only count `queued` frames. */
  let queuedSinceBaseline = 0;
  let summary = emptySummary();
  let stream: EventStream | undefined;

  const shownIds = () => new Set(rows.value.map((row) => row.id));

  function onFrame(data: unknown) {
    const frame = data as SubmissionFeedEvent;
    if (frame.type === 'queued') summary.queuedFrames += 1;
    else if (shownIds().has(frame.submissionId)) {
      summary.touchedShownRow = true;
      summary.finishedShownRow ||= frame.type === 'done';
    } else return;
    settler.poke();
  }

  async function refreshFirstPage(finishedShownRow: boolean) {
    const before = shownIds();
    const fresh = await options.refetchRows();
    if (finishedShownRow)
      void queryClient.invalidateQueries({ queryKey: ['submissions', 'stats'] });
    const added = (fresh ?? []).filter((row) => !before.has(row.id)).map((row) => row.id);
    addedIds.value = new Set(added);
    if (added.length)
      announcement.value = translate(
        'submissions.liveAdded',
        { count: added.length },
        added.length,
      );
  }

  /** How many rows arrived above the viewed page since `baselineTotal`. */
  async function countNewRows(queuedFrames: number): Promise<number> {
    queuedSinceBaseline += queuedFrames;
    const probe = await fetchSubmissions({
      ...submissionListApiQuery(filters.value),
      page: FIRST_PAGE,
      pageSize: 1,
    });
    const probeTotal = probe.meta.total;
    if (probeTotal === undefined || baselineTotal === undefined) return queuedSinceBaseline;
    return Math.max(0, probeTotal - baselineTotal);
  }

  async function refreshLaterPage({
    queuedFrames,
    touchedShownRow,
    finishedShownRow,
  }: WindowSummary) {
    if (finishedShownRow)
      void queryClient.invalidateQueries({ queryKey: ['submissions', 'stats'] });
    if (touchedShownRow) await options.refetchRows();
    if (!queuedFrames) return;
    const count = await countNewRows(queuedFrames);
    if (count > newCount.value)
      announcement.value = translate('submissions.liveNew', { count }, count);
    newCount.value = count;
  }

  async function runPass() {
    const settled = summary;
    summary = emptySummary();
    try {
      if (filters.value.page === FIRST_PAGE) await refreshFirstPage(settled.finishedShownRow);
      else await refreshLaterPage(settled);
    } catch {
      // A failed read leaves the list as it is; the next frame tries again.
    }
  }
  const settler = createSettler(LIVE_SETTLE_MS, runPass);

  function closeStream() {
    stream?.close();
    stream = undefined;
    settler.cancel();
  }
  watch(
    [enabled, connectionAttempt],
    ([isEnabled]) => {
      closeStream();
      paused.value = false;
      if (!isEnabled) return;
      const handlers = Object.fromEntries(FEED_FRAME_TYPES.map((type) => [type, onFrame]));
      stream = openEventStream(FEED_PATH, handlers, () => (paused.value = true));
    },
    { immediate: true },
  );

  /** A new filter is a new list: what was counted for the old one means nothing. */
  const filterKey = computed(() => {
    const { problem, user, results, languageIds } = filters.value;
    return JSON.stringify({ problem, user, results, languageIds });
  });
  watch(filterKey, () => {
    newCount.value = 0;
    queuedSinceBaseline = 0;
    baselineTotal = undefined;
    summary = emptySummary();
    settler.cancel();
  });
  watch([total, () => filters.value.page], ([knownTotal, page]) => {
    if (knownTotal === undefined) return;
    if (page === FIRST_PAGE) queuedSinceBaseline = 0;
    if (page === FIRST_PAGE || baselineTotal === undefined) baselineTotal = knownTotal;
  });

  function showNew() {
    newCount.value = 0;
    queuedSinceBaseline = 0;
    baselineTotal = undefined;
    options.goToFirstPage();
  }
  const reconnect = () => {
    connectionAttempt.value += 1;
    void options.refetchRows();
  };

  onScopeDispose(closeStream);
  return { newCount, announcement, addedIds, paused, showNew, reconnect };
}
