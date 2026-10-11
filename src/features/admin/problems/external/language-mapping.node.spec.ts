import { describe, expect, it } from 'vitest';
import { duplicateSiteLanguages, linkBodyOf, mappingFromVerified } from './language-mapping';

const verified = [
  { remoteId: '1', remoteName: 'C++17', suggestedLanguageId: 'cpp' },
  { remoteId: '2', remoteName: 'C++20', suggestedLanguageId: 'cpp' },
  { remoteId: '3', remoteName: 'Rust', suggestedLanguageId: null },
];

describe('mappingFromVerified', () => {
  it('uses each suggestion once and leaves the rest unused', () => {
    expect(mappingFromVerified(verified)).toEqual({ '1': 'cpp', '2': '', '3': '' });
  });

  it('keeps a language the setter already chose', () => {
    expect(mappingFromVerified(verified, { '2': 'cpp' })).toEqual({ '1': '', '2': 'cpp', '3': '' });
  });
});

describe('duplicateSiteLanguages', () => {
  it('names a site language chosen twice, ignoring unused rows', () => {
    expect(duplicateSiteLanguages({ a: 'cpp', b: 'cpp', c: '', d: '' })).toEqual(new Set(['cpp']));
    expect(duplicateSiteLanguages({ a: 'cpp', b: 'py', c: '' }).size).toBe(0);
  });
});

describe('linkBodyOf', () => {
  it('sends one row per mapped remote language and trims the ids', () => {
    const body = linkBodyOf({
      isActive: true,
      oj: ' QOJ ',
      problemId: '1001 ',
      title: 'A+B',
      remoteLanguages: [
        { remoteId: '1', remoteName: 'C++17' },
        { remoteId: '3', remoteName: 'Rust' },
      ],
      mapping: { '1': 'cpp', '3': '' },
    });
    expect(body).toEqual({
      isActive: true,
      oj: 'QOJ',
      problemId: '1001',
      title: 'A+B',
      languages: [{ languageId: 'cpp', remoteId: '1', remoteName: 'C++17' }],
    });
  });

  it('leaves the title out when there is none', () => {
    const body = linkBodyOf({
      isActive: false,
      oj: 'QOJ',
      problemId: '1',
      title: '',
      remoteLanguages: [],
      mapping: {},
    });
    expect('title' in body).toBe(false);
  });
});
