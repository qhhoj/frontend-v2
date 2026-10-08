import { onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { openEventStream } from '@/api/events';
import type { EventStream } from '@/api/events';
import type { SubmissionFeedEvent } from '@/api/types/submissions';

const FEED_PATH = '/events/submissions';
const FEED_FRAME_TYPES: SubmissionFeedEvent['type'][] = [
  'queued',
  'processing',
  'grading-begin',
  'done',
];

const isFeedEvent = (data: unknown): data is SubmissionFeedEvent =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  'submissionId' in data &&
  typeof data.submissionId === 'string';

/** What the frames of one settle window said. */
export interface FrameSummary {
  queuedFrames: number;
  touchedShownRow: boolean;
  finishedShownRow: boolean;
}
const emptySummary = (): FrameSummary => ({
  queuedFrames: 0,
  touchedShownRow: false,
  finishedShownRow: false,
});

/** Tallies the frames that matter to the list: a new submission, or progress of a row on the page. */
export function createFrameSummary(isShown: (submissionId: string) => boolean) {
  let summary = emptySummary();
  return {
    /** True when the frame matters (the caller then starts or joins a settle window). */
    add(frame: SubmissionFeedEvent): boolean {
      if (frame.type === 'queued') {
        summary.queuedFrames += 1;
        return true;
      }
      if (!isShown(frame.submissionId)) return false;
      summary.touchedShownRow = true;
      summary.finishedShownRow ||= frame.type === 'done';
      return true;
    },
    take(): FrameSummary {
      const taken = summary;
      summary = emptySummary();
      return taken;
    },
    clear() {
      summary = emptySummary();
    },
  };
}

/** Collects pokes for `windowMs`, then runs `pass` once. Pokes during a running pass join the next window. */
export function createSettler(windowMs: number, pass: () => Promise<void>) {
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

interface FeedStreamOptions {
  /** Live updates is on. */
  enabled: Ref<boolean>;
  onFrame: (frame: SubmissionFeedEvent) => void;
  /** The stream was closed (switched off, reconnecting or the scope ended): drop what it left half done. */
  onStop: () => void;
}

/** One EventSource on the public feed while `enabled`. `paused` is set when the browser gave up reconnecting. */
export function useFeedStream({ enabled, onFrame, onStop }: FeedStreamOptions) {
  const paused = ref(false);
  /** `reconnect` bumps it, which reopens the stream. */
  const connectionAttempt = ref(0);
  let stream: EventStream | undefined;
  const handleFrame = (data: unknown) => {
    if (isFeedEvent(data)) onFrame(data);
  };
  const stop = () => {
    stream?.close();
    stream = undefined;
    onStop();
  };
  watch(
    [enabled, connectionAttempt],
    ([isEnabled]) => {
      stop();
      paused.value = false;
      if (!isEnabled) return;
      const handlers = Object.fromEntries(FEED_FRAME_TYPES.map((type) => [type, handleFrame]));
      stream = openEventStream(FEED_PATH, handlers, () => (paused.value = true));
    },
    { immediate: true },
  );
  onScopeDispose(stop);
  return {
    paused,
    reconnect: () => {
      connectionAttempt.value += 1;
    },
  };
}
