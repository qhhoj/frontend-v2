import { describe, expect, it } from 'vitest';
import { submissionItem } from '@/test/fixtures';
import { scoreText } from './submission-row';

describe('scoreText', () => {
  it('never shows a score short of the maximum as the full score', () => {
    expect(scoreText(submissionItem({ points: 99.995 }), 'en')).toBe('99.99 / 100');
    expect(scoreText(submissionItem({ points: 100 }), 'en')).toBe('100 / 100');
    expect(scoreText(submissionItem({ points: 73.846 }), 'en')).toBe('73.85 / 100');
  });
});
