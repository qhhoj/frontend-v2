import type { Judge } from '@/api/types/judges-admin';
import type { LanguageAdmin } from '@/api/types/languages-admin';

export interface LanguageRow extends LanguageAdmin {
  /** `null`: the viewer cannot read the judges (`judge.change_judge`), so coverage is unknown. */
  judges: string[] | null;
  onlineJudges: string[] | null;
}

/** The judges whose runtimes carry the language's key; `onlineOnly` keeps the connected ones. */
const judgeNamesRunning = (judges: Judge[], languageKey: string, onlineOnly: boolean) =>
  judges
    .filter(
      (judge) =>
        (!onlineOnly || judge.online) &&
        judge.runtimes.some((runtime) => runtime.language === languageKey),
    )
    .map((judge) => judge.name);

export const withCoverage = (languages: LanguageAdmin[], judges: Judge[] | null): LanguageRow[] =>
  languages
    .map((language) => ({
      ...language,
      judges: judges && judgeNamesRunning(judges, language.key, false),
      onlineJudges: judges && judgeNamesRunning(judges, language.key, true),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));

/** A language that exactly one judge runs: a single point of failure for its submissions. */
export const singleJudgeLanguages = (rows: LanguageRow[]) =>
  rows.filter((row) => row.judges?.length === 1);
