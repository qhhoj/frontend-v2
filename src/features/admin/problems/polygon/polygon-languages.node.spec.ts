import { describe, expect, it } from 'vitest';
import {
  defaultLanguageChoice,
  repeatedLanguages,
  settleLanguageChoice,
  toLanguageOptions,
  tutorialCandidates,
} from './polygon-languages';

const statement = (language: string, hasTutorial = false) => ({
  language,
  title: null,
  hasTutorial,
});
const THREE = [statement('english', true), statement('russian'), statement('vietnamese', true)];

describe('defaultLanguageChoice', () => {
  it('takes Vietnamese as the main statement, English as the en translation, skips the rest', () => {
    expect(defaultLanguageChoice(THREE)).toEqual({
      main: 'vietnamese',
      others: { english: 'en', russian: 'skip' },
      tutorial: 'vietnamese',
    });
  });

  it('falls back to English, then to the first statement', () => {
    expect(defaultLanguageChoice([statement('english'), statement('russian')]).main).toBe(
      'english',
    );
    expect(defaultLanguageChoice([statement('polish'), statement('russian')])).toEqual({
      main: 'polish',
      others: { russian: 'skip' },
      tutorial: '',
    });
  });

  it('chooses nothing for a package without statements', () => {
    expect(defaultLanguageChoice([])).toEqual({ main: '', others: {}, tutorial: '' });
  });
});

describe('settleLanguageChoice', () => {
  it('turns the former main statement into a translation when another becomes main', () => {
    const choice = defaultLanguageChoice(THREE);
    expect(settleLanguageChoice(THREE, { ...choice, main: 'english' })).toEqual({
      main: 'english',
      others: { russian: 'skip', vietnamese: 'vi' },
      tutorial: 'vietnamese',
    });
  });

  it('moves the tutorial off a statement that is now skipped', () => {
    const choice = {
      main: 'english',
      others: { russian: 'skip', vietnamese: 'skip' },
      tutorial: 'vietnamese',
    } as const;
    expect(settleLanguageChoice(THREE, { ...choice, others: { ...choice.others } }).tutorial).toBe(
      'english',
    );
  });
});

describe('tutorialCandidates', () => {
  it('counts the main statement and the translations, never a skipped statement', () => {
    const choice = defaultLanguageChoice(THREE);
    expect(tutorialCandidates(THREE, choice)).toEqual(['english', 'vietnamese']);
    expect(tutorialCandidates(THREE, { ...choice, others: { english: 'skip' } })).toEqual([
      'vietnamese',
    ]);
  });
});

describe('repeatedLanguages', () => {
  it('names the second statement mapped to a site language, not skips', () => {
    expect(
      repeatedLanguages({
        main: 'a',
        others: { b: 'en', c: 'en', d: 'skip', e: 'skip' },
        tutorial: '',
      }),
    ).toEqual(['c']);
    expect(repeatedLanguages({ main: 'a', others: { b: 'en', c: 'vi' }, tutorial: '' })).toEqual(
      [],
    );
  });
});

describe('toLanguageOptions', () => {
  it('sends nothing for a single statement', () => {
    const one = [statement('vietnamese', true)];
    expect(toLanguageOptions(one, defaultLanguageChoice(one))).toEqual({});
  });

  it('names the main statement, every other one, and the tutorial when two count', () => {
    expect(toLanguageOptions(THREE, defaultLanguageChoice(THREE))).toEqual({
      mainStatementLanguage: 'vietnamese',
      statementLanguages: ['english=en', 'russian=skip'],
      tutorialLanguage: 'vietnamese',
    });
  });

  it('leaves the tutorial to the server when only one counts', () => {
    const choice = {
      main: 'vietnamese',
      others: { english: 'skip', russian: 'skip' },
      tutorial: 'vietnamese',
    } as const;
    expect(
      toLanguageOptions(THREE, { ...choice, others: { ...choice.others } }).tutorialLanguage,
    ).toBeUndefined();
  });
});
