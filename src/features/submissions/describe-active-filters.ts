import type { Language } from '@/api/types/problems';
import { translate } from '@/i18n';
import type { SubmissionFilters } from './use-submission-filters';

/** The filters in force as text (`kết quả: IE · bài: duongdi`), for the empty state; `''` when none is set. */
export function describeActiveFilters(filters: SubmissionFilters, languages: Language[]): string {
  const languageNames = filters.languageIds.map(
    (id) => languages.find((language) => language.id === id)?.name ?? id,
  );
  const entries: [string, string][] = [
    ['result', filters.results.join(', ')],
    ['problem', filters.problem],
    ['user', filters.user],
    ['language', languageNames.join(', ')],
  ];
  return entries
    .filter(([, value]) => value !== '')
    .map(([name, value]) => `${translate(`submissions.filterNames.${name}`)}: ${value}`)
    .join(' · ');
}
