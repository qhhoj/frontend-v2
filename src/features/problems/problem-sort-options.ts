import { PROBLEM_SORT_FIELDS } from '@/api/types/problems';
import type { ProblemSort } from '@/api/types/problems';
import { translate } from '@/i18n';

/** What the API sorts by when the URL names no sort. */
export const DEFAULT_SORT: ProblemSort = '-date';

/** Every sort the API accepts, labelled `Điểm ↓` (highest first) or `Điểm ↑`. */
export const sortOptions = () =>
  PROBLEM_SORT_FIELDS.flatMap((field) =>
    ([`-${field}`, field] as const).map((value) => ({
      value,
      label: `${translate(`problems.sortField.${field}`)} ${value.startsWith('-') ? '↓' : '↑'}`,
    })),
  );
