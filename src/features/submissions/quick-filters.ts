import type { SubmissionResult } from '@/api/types/submissions';
import type { SubmissionFilters } from './use-submission-filters';

/** The one-click filters above the list; each is a shortcut for filters the advanced panel can also set. */
export type QuickFilter = 'mine' | 'accepted' | 'errors' | 'grading';

/** "Lỗi": every result that is the contestant's fault (system outcomes such as IE stay out). */
export const ERROR_RESULTS: readonly SubmissionResult[] = [
  'WA',
  'TLE',
  'MLE',
  'OLE',
  'IR',
  'RTE',
  'CE',
];

const sameSet = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && right.every((value) => left.includes(value));

/** Whether the URL's filters are what this chip sets: a deep link lights the right chip. */
export function isQuickFilterOn(
  filters: SubmissionFilters,
  chip: QuickFilter,
  username: string | null,
): boolean {
  switch (chip) {
    case 'mine':
      return username !== null && filters.user === username;
    case 'accepted':
      return sameSet(filters.results, ['AC']);
    case 'errors':
      return sameSet(filters.results, ERROR_RESULTS);
    case 'grading':
      return filters.statusGroups.includes('grading');
  }
}

/** The filter change of a click on the chip: on sets its filter (AC and Lỗi replace each other), off clears it. */
export function quickFilterPatch(
  filters: SubmissionFilters,
  chip: QuickFilter,
  username: string | null,
): Partial<SubmissionFilters> {
  const isOn = isQuickFilterOn(filters, chip, username);
  switch (chip) {
    case 'mine':
      return { user: isOn ? '' : (username ?? '') };
    case 'accepted':
      return { results: isOn ? [] : ['AC'] };
    case 'errors':
      return { results: isOn ? [] : [...ERROR_RESULTS] };
    case 'grading':
      return {
        statusGroups: isOn
          ? filters.statusGroups.filter((group) => group !== 'grading')
          : [...filters.statusGroups, 'grading'],
      };
  }
}

/** How many filters only the advanced panel shows: the problem, another user, or results no chip stands for. */
export function advancedFilterCount(filters: SubmissionFilters, username: string | null): number {
  const resultsByChip =
    filters.results.length === 0 ||
    isQuickFilterOn(filters, 'accepted', username) ||
    isQuickFilterOn(filters, 'errors', username);
  return [
    filters.problem !== '',
    filters.user !== '' && filters.user !== username,
    !resultsByChip,
  ].filter(Boolean).length;
}
