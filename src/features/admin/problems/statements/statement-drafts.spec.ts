import { describe, expect, it } from 'vitest';
import { editableProblem } from '@/test/admin-fixtures/problems';
import {
  insertImage,
  isOriginalLocked,
  previewStyleFor,
  statementDraftOf,
} from './statement-drafts';

describe('statement drafts', () => {
  it('reads an existing translation, an empty missing one, and the original description', () => {
    const problem = editableProblem();
    expect(statementDraftOf(problem, 'vi')).toEqual({
      name: 'Đường đi ngắn nhất có ràng buộc',
      description: 'Cho đồ thị vô hướng gồm $n$ đỉnh.',
      exists: true,
    });
    expect(statementDraftOf(problem, 'en')).toEqual({ name: '', description: '', exists: false });
    expect(statementDraftOf(problem, 'original').description).toBe(
      'Cho đồ thị vô hướng gồm $n$ đỉnh.',
    );
  });

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
