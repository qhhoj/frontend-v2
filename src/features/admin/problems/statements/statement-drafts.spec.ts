import { describe, expect, it } from 'vitest';
import { editableProblem } from '@/test/admin-fixtures/problems';
import { insertImage, isOriginalLocked, previewStyleFor } from './statement-drafts';

describe('statement drafts', () => {
  it('asks for problem-full only for a full-markup problem and a viewer allowed to see it', () => {
    expect(previewStyleFor(editableProblem({ isFullMarkup: true }), true)).toBe('problem-full');
    expect(previewStyleFor(editableProblem({ isFullMarkup: true }), false)).toBe('problem');
    expect(previewStyleFor(editableProblem({ isFullMarkup: false }), true)).toBe('problem');
  });

  it('puts the image on its own line at the caret and moves the caret after it', () => {
    expect(insertImage('ab', '/u/x.png', 1)).toEqual({ text: 'a\n![](/u/x.png)\nb', caret: 16 });
  });

  it('locks the original description of a full-markup problem for a viewer without the markup permission only', () => {
    expect(isOriginalLocked(editableProblem({ isFullMarkup: true }), false)).toBe(true);
    expect(isOriginalLocked(editableProblem({ isFullMarkup: true }), true)).toBe(false);
    expect(isOriginalLocked(editableProblem({ isFullMarkup: false }), false)).toBe(false);
  });
});
