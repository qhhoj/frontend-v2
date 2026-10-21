import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/api/schemas';
import {
  isFailureAnswered,
  linkChoiceOf,
  linkOptionsBodyOf,
  linkOptionsLineOf,
  linkStatementsOf,
} from './polygon-link-options';

type Options = Schemas['PolygonLinkOptionsResponse'];
const options = (overrides: Partial<Options> = {}): Options => ({
  mainStatementLanguage: 'vietnamese',
  statementLanguages: ['english=en'],
  tutorialLanguage: 'vietnamese',
  ignoreZeroPointBatches: false,
  ignoreZeroPointCases: false,
  appendMainSolution: false,
  maxCases: 100,
  ...overrides,
});
const flags = {
  ignoreZeroPointBatches: true,
  ignoreZeroPointCases: false,
  appendMainSolution: false,
};

describe('linkStatementsOf', () => {
  it('lists the statements the saved options name, the tutorial where one was chosen', () => {
    expect(linkStatementsOf(options(), [])).toEqual([
      { language: 'vietnamese', title: null, hasTutorial: true },
      { language: 'english', title: null, hasTutorial: false },
    ]);
  });

  it('adds a statement the last sync found without a site language', () => {
    const statements = linkStatementsOf(options(), [
      { code: 'statement_language_unmapped', params: { language: 'russian' } },
    ]);
    expect(statements.map(({ language }) => language)).toEqual([
      'vietnamese',
      'english',
      'russian',
    ]);
  });

  it('offers every tutorial a tutorial_language_required failure listed', () => {
    const statements = linkStatementsOf(options({ tutorialLanguage: null }), [
      { code: 'tutorial_language_required', params: { languages: ['english', 'vietnamese'] } },
    ]);
    expect(
      statements.filter(({ hasTutorial }) => hasTutorial).map(({ language }) => language),
    ).toEqual(['vietnamese', 'english']);
  });

  it('has nothing to choose for a single-statement package', () => {
    const single = options({
      mainStatementLanguage: null,
      statementLanguages: [],
      tutorialLanguage: null,
    });
    expect(linkStatementsOf(single, [])).toEqual([]);
  });

  it('offers what a refused save named beside the last sync failure, for a package that had one statement', () => {
    const single = options({
      mainStatementLanguage: null,
      statementLanguages: [],
      tutorialLanguage: null,
    });
    const statements = linkStatementsOf(single, [
      { code: null, params: null },
      { code: 'statement_language_required', params: { languages: ['vietnamese', 'english'] } },
      { code: 'tutorial_language_required', params: { languages: ['vietnamese', 'english'] } },
    ]);
    expect(statements).toEqual([
      { language: 'vietnamese', title: null, hasTutorial: true },
      { language: 'english', title: null, hasTutorial: true },
    ]);
  });
});

describe('linkChoiceOf and linkOptionsBodyOf', () => {
  it('round-trips the saved options, a new statement skipped until the setter maps it', () => {
    const statements = linkStatementsOf(options(), [
      { code: 'statement_language_unmapped', params: { language: 'russian' } },
    ]);
    const choice = linkChoiceOf(options(), statements);
    expect(choice).toEqual({
      main: 'vietnamese',
      others: { english: 'en', russian: 'skip' },
      tutorial: 'vietnamese',
    });
    expect(linkOptionsBodyOf(choice, flags)).toEqual({
      mainStatementLanguage: 'vietnamese',
      statementLanguages: ['english=en', 'russian=skip'],
      tutorialLanguage: 'vietnamese',
      ...flags,
    });
  });

  it('sends null for no main statement and no tutorial', () => {
    const body = linkOptionsBodyOf({ main: '', others: {}, tutorial: '' }, flags);
    expect(body).toMatchObject({
      mainStatementLanguage: null,
      statementLanguages: [],
      tutorialLanguage: null,
    });
  });
});

describe('isFailureAnswered', () => {
  const choice = { main: 'vietnamese', others: { english: 'en' as const }, tutorial: 'vietnamese' };
  const failure = (code: string, params: Record<string, unknown>) => ({ code, params });

  it('answers a missing main or tutorial with one the failure listed', () => {
    const listed = { languages: ['vietnamese', 'english'] };
    expect(isFailureAnswered(failure('statement_language_required', listed), choice)).toBe(true);
    expect(isFailureAnswered(failure('tutorial_language_required', listed), choice)).toBe(true);
    const unpicked = { ...choice, main: '', tutorial: '' };
    expect(isFailureAnswered(failure('statement_language_required', listed), unpicked)).toBe(false);
    expect(isFailureAnswered(failure('tutorial_language_required', listed), unpicked)).toBe(false);
  });

  it('answers an unmapped statement once it has a choice, skip included', () => {
    const unmapped = failure('statement_language_unmapped', { language: 'russian' });
    expect(isFailureAnswered(unmapped, choice)).toBe(false);
    const skipped = { ...choice, others: { ...choice.others, russian: 'skip' as const } };
    expect(isFailureAnswered(unmapped, skipped)).toBe(true);
  });

  it('answers a repeated site language only when none repeats', () => {
    const repeated = failure('statement_language_repeated', { language: 'russian' });
    expect(isFailureAnswered(repeated, choice)).toBe(true);
    const twice = { ...choice, others: { english: 'en' as const, russian: 'en' as const } };
    expect(isFailureAnswered(repeated, twice)).toBe(false);
  });

  it('never answers a failure the languages cannot fix', () => {
    expect(isFailureAnswered(failure('too_many_testcases', { count: 9, limit: 5 }), choice)).toBe(
      false,
    );
    expect(isFailureAnswered({ code: null, params: null }, choice)).toBe(false);
  });
});

describe('linkOptionsLineOf', () => {
  it('puts the saved options on one line', () => {
    expect(
      linkOptionsLineOf(
        options({ statementLanguages: ['english=en', 'russian=skip'], ignoreZeroPointCases: true }),
      ),
    ).toBe(
      'vietnamese (chính) · english → en · russian: bỏ qua · lời giải từ vietnamese · bỏ test 0 điểm',
    );
  });

  it('says when nothing was chosen', () => {
    expect(
      linkOptionsLineOf(
        options({ mainStatementLanguage: null, statementLanguages: [], tutorialLanguage: null }),
      ),
    ).toBe('Theo gói, không chọn gì thêm');
  });
});
