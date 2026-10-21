import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/api/schemas';
import {
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
    expect(linkStatementsOf(options(), null, null)).toEqual([
      { language: 'vietnamese', title: null, hasTutorial: true },
      { language: 'english', title: null, hasTutorial: false },
    ]);
  });

  it('adds a statement the last sync found without a site language', () => {
    const statements = linkStatementsOf(options(), 'statement_language_unmapped', {
      language: 'russian',
    });
    expect(statements.map(({ language }) => language)).toEqual([
      'vietnamese',
      'english',
      'russian',
    ]);
  });

  it('offers every tutorial a tutorial_language_required failure listed', () => {
    const statements = linkStatementsOf(
      options({ tutorialLanguage: null }),
      'tutorial_language_required',
      { languages: ['english', 'vietnamese'] },
    );
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
    expect(linkStatementsOf(single, null, null)).toEqual([]);
  });
});

describe('linkChoiceOf and linkOptionsBodyOf', () => {
  it('round-trips the saved options, a new statement skipped until the setter maps it', () => {
    const statements = linkStatementsOf(options(), 'statement_language_unmapped', {
      language: 'russian',
    });
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
