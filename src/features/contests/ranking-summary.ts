import { translate } from '@/i18n';
import { formatLabel } from '@/lib/contest-format';

/** "ICPC · 3 problems · 1 contestant": each count picks its own plural form. */
export function rankingSummary(formatName: string, problems: number, participants: number): string {
  return translate(
    'ranking.summary',
    {
      format: formatLabel(formatName),
      problems,
      participants: translate('contests.participants', { count: participants }, participants),
    },
    problems,
  );
}
