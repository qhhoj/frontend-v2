import type { PolygonProblem } from '@/api/types/polygon';
import type { ImportOptions } from '@/api/types/problem-imports';

type Statement = PolygonProblem['statements'][number];

/** What QHHOJ does with a statement other than the main one: a translation in `en` or `vi`, or left out. */
export const SITE_LANGUAGE_CHOICES = ['en', 'vi', 'skip'] as const;
export type SiteLanguageChoice = (typeof SITE_LANGUAGE_CHOICES)[number];

/** The import's statement choices, as the configure step's selects hold them. */
export interface LanguageChoice {
  /** Polygon language of the statement stored as the problem's own; '' when the package has none. */
  main: string;
  /** Every other statement's choice, keyed by its Polygon language. */
  others: Record<string, SiteLanguageChoice>;
  /** Polygon language of the tutorial imported as the editorial; '' when there is no choice to make. */
  tutorial: string;
}

/** QHHOJ's statements are Vietnamese first; Polygon names languages in English words. */
const MAIN_PREFERENCE = ['vietnamese', 'english'];
const SITE_DEFAULTS: Record<string, SiteLanguageChoice> = { english: 'en', vietnamese: 'vi' };
const siteDefaultOf = (language: string): SiteLanguageChoice =>
  Object.hasOwn(SITE_DEFAULTS, language) ? SITE_DEFAULTS[language]! : 'skip';

/** The tutorials an import can take, as the server counts them: the main statement's and those not skipped. */
export function tutorialCandidates(statements: Statement[], choice: LanguageChoice): string[] {
  return statements
    .filter(({ language, hasTutorial }) => hasTutorial && choice.others[language] !== 'skip')
    .map(({ language }) => language);
}

/** The choice made whole for these statements: every other statement has a choice, the tutorial is one that counts. */
export function settleLanguageChoice(
  statements: Statement[],
  choice: LanguageChoice,
): LanguageChoice {
  const languages = statements.map(({ language }) => language);
  const main = languages.includes(choice.main) ? choice.main : (languages[0] ?? '');
  const others = Object.fromEntries(
    languages
      .filter((language) => language !== main)
      .map((language) => [language, choice.others[language] ?? siteDefaultOf(language)]),
  );
  const settled = { main, others, tutorial: '' };
  const tutorials = tutorialCandidates(statements, settled);
  const tutorial = tutorials.includes(choice.tutorial)
    ? choice.tutorial
    : tutorials.includes(main)
      ? main
      : (tutorials[0] ?? '');
  return { ...settled, tutorial };
}

/** Vietnamese, else English, else the first statement is the main one; English and Vietnamese others become translations. */
export function defaultLanguageChoice(statements: Statement[]): LanguageChoice {
  const languages = statements.map(({ language }) => language);
  const main = MAIN_PREFERENCE.find((language) => languages.includes(language)) ?? '';
  return settleLanguageChoice(statements, { main, others: {}, tutorial: '' });
}

/** The other statements that map to a site language an earlier one already has: the server refuses the second. */
export function repeatedLanguages(choice: LanguageChoice): string[] {
  const taken = new Set<SiteLanguageChoice>();
  return Object.entries(choice.others)
    .filter(([, site]) => {
      if (site === 'skip') return false;
      const isRepeated = taken.has(site);
      taken.add(site);
      return isRepeated;
    })
    .map(([language]) => language);
}

type LanguageOptions = Pick<
  ImportOptions,
  'mainStatementLanguage' | 'statementLanguages' | 'tutorialLanguage'
>;

/** The import options for the choice; a single statement needs none (the server takes it as the main one). */
export function toLanguageOptions(
  statements: Statement[],
  choice: LanguageChoice,
): LanguageOptions {
  if (statements.length < 2) return {};
  const tutorials = tutorialCandidates(statements, choice);
  return {
    mainStatementLanguage: choice.main,
    statementLanguages: Object.entries(choice.others).map(
      ([language, site]) => `${language}=${site}`,
    ),
    tutorialLanguage: tutorials.length > 1 ? choice.tutorial : undefined,
  };
}
