import type { Schemas } from '@/api/schemas';
import type { PolygonProblem } from '@/api/types/polygon';
import { translate } from '@/i18n';
import {
  SITE_LANGUAGE_CHOICES,
  repeatedLanguages,
  settleLanguageChoice,
} from './polygon-languages';
import type { LanguageChoice, SiteLanguageChoice } from './polygon-languages';

type Options = Schemas['PolygonLinkOptionsResponse'];
type Statement = PolygonProblem['statements'][number];
/** The flags the drawer edits beside the languages. */
export type LinkFlags = Pick<
  Options,
  'ignoreZeroPointBatches' | 'ignoreZeroPointCases' | 'appendMainSolution'
>;
/** The PATCH body of the link's saved options; `maxCases` is not editable, `autoSync` has its own switch. */
export type LinkOptionsBody = LinkFlags &
  Pick<Options, 'mainStatementLanguage' | 'statementLanguages' | 'tutorialLanguage'>;

/** `english=en` pairs as a map; a malformed pair or an unknown site language is left out. */
function savedPairs(options: Options): Record<string, SiteLanguageChoice> {
  const pairs: Record<string, SiteLanguageChoice> = {};
  for (const pair of options.statementLanguages) {
    const [language = '', site = ''] = pair.split('=');
    if (language && (SITE_LANGUAGE_CHOICES as readonly string[]).includes(site))
      pairs[language] = site as SiteLanguageChoice;
  }
  return pairs;
}

const listParam = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : typeof value === 'string' ? [value] : [];

/** A sync failure or a refusal of the options: its code and params. */
export interface OptionsFailure {
  code: string | null;
  params: Record<string, unknown> | null;
}

/** The Polygon languages a failure names: a statement without a site language, or the choices it lacked. */
function failureLanguages({ code, params }: OptionsFailure): string[] {
  switch (code) {
    case 'statement_language_unmapped':
      return listParam(params?.language);
    case 'statement_language_required':
    case 'tutorial_language_required':
      return listParam(params?.languages);
    default:
      return [];
  }
}

/**
 * The statements the drawer offers, without a preview of the package: the ones the saved options name, plus the ones the
 * failures named (the last sync's, the refusals of a save: a statement new on Polygon). A tutorial is known only where it
 * was chosen or listed by a `tutorial_language_required` failure: elsewhere the server ignores the choice anyway.
 */
export function linkStatementsOf(options: Options, failures: OptionsFailure[]): Statement[] {
  const named = [options.mainStatementLanguage ?? '', ...Object.keys(savedPairs(options))];
  const languages = [...new Set([...named, ...failures.flatMap(failureLanguages)])].filter(Boolean);
  const tutorials = new Set([options.tutorialLanguage ?? '']);
  for (const { code, params } of failures)
    if (code === 'tutorial_language_required')
      for (const language of listParam(params?.languages)) tutorials.add(language);
  return languages.map((language) => ({
    language,
    title: null,
    hasTutorial: tutorials.has(language),
  }));
}

/**
 * Whether the choice already answers a failure of the options: the main statement or the tutorial is one it listed, the
 * statement it named has a choice, no site language is taken twice. Its fix then no longer belongs under the field.
 */
export function isFailureAnswered({ code, params }: OptionsFailure, choice: LanguageChoice) {
  switch (code) {
    case 'statement_language_required':
      return listParam(params?.languages).includes(choice.main);
    case 'tutorial_language_required':
      return listParam(params?.languages).includes(choice.tutorial);
    case 'statement_language_unmapped':
      return listParam(params?.language).every((language) =>
        Object.hasOwn(choice.others, language),
      );
    case 'statement_language_repeated':
      return repeatedLanguages(choice).length === 0;
    default:
      return false;
  }
}

/** The saved options as the language selects hold them, made whole for these statements. */
export const linkChoiceOf = (options: Options, statements: Statement[]): LanguageChoice =>
  settleLanguageChoice(statements, {
    main: options.mainStatementLanguage ?? '',
    others: savedPairs(options),
    tutorial: options.tutorialLanguage ?? '',
  });

/** The whole saved options as the PATCH replaces them. */
export const linkOptionsBodyOf = (choice: LanguageChoice, flags: LinkFlags): LinkOptionsBody => ({
  mainStatementLanguage: choice.main || null,
  statementLanguages: Object.entries(choice.others).map(
    ([language, site]) => `${language}=${site}`,
  ),
  tutorialLanguage: choice.tutorial || null,
  ignoreZeroPointBatches: flags.ignoreZeroPointBatches,
  ignoreZeroPointCases: flags.ignoreZeroPointCases,
  appendMainSolution: flags.appendMainSolution,
});

const KEY = 'admin.polygonLink.panel.options';
const FLAGS = ['ignoreZeroPointBatches', 'ignoreZeroPointCases', 'appendMainSolution'] as const;

/** The saved options on one line: the main statement, what each other one becomes, the tutorial and the flags set. */
export function linkOptionsLineOf(options: Options): string {
  const pairs = Object.entries(savedPairs(options)).map(([language, site]) =>
    site === 'skip'
      ? translate(`${KEY}.skipped`, { language })
      : translate(`${KEY}.mapped`, { language, site }),
  );
  const parts = [
    ...(options.mainStatementLanguage
      ? [translate(`${KEY}.main`, { language: options.mainStatementLanguage })]
      : []),
    ...pairs,
    ...(options.tutorialLanguage
      ? [translate(`${KEY}.tutorial`, { language: options.tutorialLanguage })]
      : []),
    ...FLAGS.filter((flag) => options[flag]).map((flag) => translate(`${KEY}.flags.${flag}`)),
  ];
  return parts.length > 0 ? parts.join(' · ') : translate(`${KEY}.defaults`);
}
