import type { EditableContest } from '@/api/types/contest-editing';
import type { ListStep } from '../../search/problem-setup-marks';
import { labelFor } from '../problems/contest-problems';
import { participantGapOf, participantModeOf } from './participants-mode';
import { toContestForm } from '../contest-form';

/** The plate's sentence: a hidden contest is "hidden" whatever the clock says; a shown one follows its phase. */
export type ContestStatus = 'hidden' | 'upcoming' | 'running' | 'ended';
export const contestStatusOf = (contest: EditableContest): ContestStatus =>
  contest.settings?.isVisible ? contest.phase : 'hidden';

/** One thing the saved contest still lacks. `label`: the problem's label in the contest ("C"). */
export type ContestGap =
  | { kind: 'noProblems' }
  | { kind: 'problemSetup'; label: string; code: string }
  | { kind: 'participants'; missing: 'open' | 'organization' | 'list' };

/**
 * What the saved contest still lacks, in the order a teacher fixes it: no problem at all, a problem whose setup is not
 * finished, no rule for who takes part. `marks` holds the setup steps of the problems the viewer may edit, by code; a
 * problem without an entry (not the viewer's to edit, or not read yet) is never called unfinished.
 */
export function contestGapsOf(
  contest: EditableContest,
  marks: ReadonlyMap<string, readonly ListStep[]>,
): ContestGap[] {
  const gaps: ContestGap[] = [];
  const problems = contest.problems ?? [];
  if (problems.length === 0) gaps.push({ kind: 'noProblems' });
  problems.forEach((problem, index) => {
    const steps = marks.get(problem.code);
    if (steps?.some((step) => !step.isDone))
      gaps.push({
        kind: 'problemSetup',
        label: labelFor(index, contest.labelStyle),
        code: problem.code,
      });
  });
  const form = toContestForm(contest);
  const mode = participantModeOf(form, contest.requiresAccessCode);
  const missing = mode === 'open' ? 'open' : participantGapOf(form, contest.requiresAccessCode);
  if (missing === 'open' || missing === 'organization' || missing === 'list')
    gaps.push({ kind: 'participants', missing });
  return gaps;
}
