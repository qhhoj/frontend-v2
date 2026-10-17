import { quickFilterPatch } from '@/features/submissions/quick-filters';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';

/** One chip of the contest's submission tab (P-21): every problem, one problem by its letter, or the ones in grading. */
export type ContestChip = { kind: 'all' } | { kind: 'problem'; code: string } | { kind: 'grading' };

const isGrading = (filters: SubmissionFilters) => filters.statusGroups.includes('grading');
/** Nothing narrows the list: no problem, no grading box, no result or language (a link may carry those). */
const isUnfiltered = (filters: SubmissionFilters) =>
  filters.problem === '' &&
  !isGrading(filters) &&
  filters.results.length === 0 &&
  filters.languageIds.length === 0;

/** Whether the URL's filters are what this chip shows, so a deep link lights the right chip. */
export function isContestChipOn(filters: SubmissionFilters, chip: ContestChip): boolean {
  if (chip.kind === 'all') return isUnfiltered(filters);
  if (chip.kind === 'problem') return filters.problem === chip.code;
  return isGrading(filters);
}

/** The filter change of a click: a letter picks its problem (again: every problem), "Tất cả" clears what narrows the list. */
export function contestChipPatch(
  filters: SubmissionFilters,
  chip: ContestChip,
): Partial<SubmissionFilters> {
  if (chip.kind === 'all')
    return {
      problem: '',
      results: [],
      languageIds: [],
      statusGroups: filters.statusGroups.filter((group) => group !== 'grading'),
    };
  if (chip.kind === 'problem') return { problem: isContestChipOn(filters, chip) ? '' : chip.code };
  return quickFilterPatch(filters, 'grading', null);
}
