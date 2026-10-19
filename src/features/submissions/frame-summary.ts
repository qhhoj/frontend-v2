import type { SubmissionFeedEvent } from '@/api/types/submissions';

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
