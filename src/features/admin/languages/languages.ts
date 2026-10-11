import type { Judge } from '@/api/types/judges-admin';
import type { LanguageAdmin } from '@/api/types/languages-admin';

export interface JudgeVersion {
  judge: string;
  /** Compiler or interpreter and its version, as the judge reports it. */
  runtime: string;
}

export interface LanguageRow extends LanguageAdmin {
  /** `null`: the viewer cannot read the judges (`judge.change_judge`), so coverage is unknown. */
  judges: string[] | null;
  /** Connected judges that take work (neither blocked nor disabled). */
  onlineJudges: string[] | null;
  /** The runtime each judge reports for the language. */
  versions: JudgeVersion[] | null;
}

/** A connected judge a blocked or disabled flag keeps from taking work does not count as coverage. */
const isUsableOnline = (judge: Judge) => judge.online && !judge.isBlocked && !judge.isDisabled;

/** One line per judge: a judge reporting several runtimes for the language (e.g. CPython and PyPy) lists them together. */
const versionsOf = (judges: Judge[], languageKey: string): JudgeVersion[] =>
  judges.flatMap((judge) => {
    const runtimes = judge.runtimes
      .filter((runtime) => runtime.language === languageKey)
      .map((runtime) => `${runtime.name} ${runtime.version}`)
      .sort();
    return runtimes.length ? [{ judge: judge.name, runtime: runtimes.join(' · ') }] : [];
  });

/** The judges whose runtimes carry the language's key; `onlineOnly` keeps the usable connected ones. */
const judgeNamesRunning = (judges: Judge[], languageKey: string, onlineOnly: boolean) =>
  judges
    .filter(
      (judge) =>
        (!onlineOnly || isUsableOnline(judge)) &&
        judge.runtimes.some((runtime) => runtime.language === languageKey),
    )
    .map((judge) => judge.name);

export const withCoverage = (languages: LanguageAdmin[], judges: Judge[] | null): LanguageRow[] =>
  languages
    .map((language) => ({
      ...language,
      judges: judges && judgeNamesRunning(judges, language.key, false),
      onlineJudges: judges && judgeNamesRunning(judges, language.key, true),
      versions: judges && versionsOf(judges, language.key),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));

/** A language that exactly one judge runs: a single point of failure for its submissions. */
export const singleJudgeLanguages = (rows: LanguageRow[]) =>
  rows.filter((row) => row.judges?.length === 1);

/** A language problems offer that no usable judge runs right now: its submissions wait in the queue (the real outage). */
export const unservedLanguages = (rows: LanguageRow[]) =>
  rows.filter((row) => row.includeInProblem && row.onlineJudges?.length === 0);

/** Judges report different runtimes for the language: the same source may get different verdicts. */
export const hasVersionDrift = (row: LanguageRow) =>
  new Set((row.versions ?? []).map((version) => version.runtime)).size > 1;
