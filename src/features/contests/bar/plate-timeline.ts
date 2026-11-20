import type { ContestProblem } from '@/api/types/contests';
import type { SubmissionListItem } from '@/api/types/submissions';
import type { TimelineEvent, TimelineTick } from '@/components/ui/ContestTimeline.vue';
import { formatElapsed } from '@/lib/format';
import { formatClock } from '@/lib/format-date';
import { submissionVerdictOf } from '@/lib/verdicts';

const MINUTE_MS = 60_000;
/** The steps a scale may count in, in minutes; the first that leaves at most `MAX_STEPS` parts is used. */
const STEP_MINUTES = [15, 30, 60, 120, 180, 360, 720];
const MAX_STEPS = 4;
/** A tick closer than this share of the scale to the end is dropped: its label would run into the end's. */
const END_CLEARANCE = 0.15;

/**
 * The marks of a contest's time scale: both ends with their labels (clocks on a one-day contest, dates otherwise) and,
 * on a one-day contest, a clock at each whole step between them. A contest of several days keeps its two ends.
 */
export function timelineTicks(
  start: number,
  end: number,
  ends: { start: string; end: string },
  isOneDay: boolean,
): TimelineTick[] {
  const length = end - start;
  const edges = [
    { at: start, label: ends.start },
    { at: end, label: ends.end },
  ];
  const step = STEP_MINUTES.find((minutes) => length / (minutes * MINUTE_MS) <= MAX_STEPS);
  if (!isOneDay || length <= 0 || step === undefined) return edges;
  const inner: TimelineTick[] = [];
  for (let at = start + step * MINUTE_MS; at < end - length * END_CLEARANCE; at += step * MINUTE_MS)
    inner.push({ at, label: formatClock(new Date(at).toISOString()) });
  return [edges[0]!, ...inner, edges[1]!];
}

/**
 * The viewer's submissions as lamps on the scale, oldest first. `say` words one lamp from the time since the start
 * (`1:12`), the problem's label in the contest (its code when the contest does not list it) and the verdict's message key.
 */
export function timelineEvents(
  submissions: readonly SubmissionListItem[],
  problems: readonly ContestProblem[],
  start: number,
  say: (parts: { elapsed: string; problem: string; verdictKey: string }) => string,
): TimelineEvent[] {
  const labels = new Map(problems.map((problem) => [problem.code, problem.label]));
  return submissions
    .map((submission) => {
      const at = Date.parse(submission.date);
      const verdict = submissionVerdictOf(submission);
      const code = submission.problem?.code ?? '';
      return {
        at,
        tone: verdict.tone,
        label: say({
          elapsed: formatElapsed(Math.max(0, at - start) / 1000),
          problem: labels.get(code) ?? code,
          verdictKey: verdict.labelKey,
        }),
      };
    })
    .sort((first, second) => first.at - second.at);
}
