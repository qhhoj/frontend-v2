import { describe, expect, it } from 'vitest';
import type { ContestFormatName } from '@/api/types/contest-editing';
import { configFor, FORMAT_FIELDS } from './format-config';

const EVERYTHING = {
  penalty: 1,
  lso: true,
  cumtime: true,
  lastScoreAltering: true,
  autoJudge: false,
  bogus: 1,
};

describe('format config', () => {
  it('fills every field a format offers with a default, and never carries a key the format does not offer', () => {
    for (const name of Object.keys(FORMAT_FIELDS) as ContestFormatName[]) {
      const offered = FORMAT_FIELDS[name].map((field) => field.name).sort();
      expect(Object.keys(configFor(name, {})).sort(), `${name} defaults`).toEqual(offered);
      expect(Object.keys(configFor(name, EVERYTHING)).sort(), `${name} stored`).toEqual(offered);
    }
  });

  it('keeps the stored value of a known key and drops unknown ones', () => {
    expect(configFor('icpc', { penalty: 10, bogus: 1 })).toEqual({ penalty: 10 });
    expect(configFor('ioi', {})).toEqual({ cumtime: false, lastScoreAltering: false });
    expect(configFor('ultimate', { penalty: 3 })).toEqual({});
  });
});
