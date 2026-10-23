import { describe, expect, it } from 'vitest';
import { editableProblem } from '@/test/admin-fixtures/problems';
import {
  checkStatementDraft,
  initialSlotOf,
  insertImage,
  isOriginalLocked,
  previewStyleFor,
  visibleStatementErrors,
} from './statement-drafts';

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

  it('opens on the Vietnamese translation when there is one, else on the base statement', () => {
    expect(initialSlotOf(editableProblem())).toBe('vi');
    const baseOnly = editableProblem();
    baseOnly.editor!.translations = [{ language: 'en', name: 'Path', description: 'A graph.' }];
    expect(initialSlotOf(baseOnly)).toBe('original');
  });
});

describe('visible statement errors', () => {
  const missing = { name: '', description: '', exists: false, storedDescription: '' };
  const errorsOf = (draft: typeof missing) => checkStatementDraft(draft, 'en');

  it('shows nothing for a missing translation that was only opened', () => {
    expect(errorsOf(missing).name).toBeDefined();
    expect(visibleStatementErrors(errorsOf(missing), missing, missing, false)).toEqual({});
  });

  it('shows the empty name once a save was tried', () => {
    const draft = { ...missing, description: 'A graph.' };
    expect(Object.keys(visibleStatementErrors(errorsOf(draft), draft, missing, true))).toEqual([
      'name',
    ]);
  });

  it('shows a field’s own error as soon as the field changed, and not the untouched one', () => {
    const draft = { ...missing, description: 'It’s a graph.' };
    expect(Object.keys(visibleStatementErrors(errorsOf(draft), draft, missing, false))).toEqual([
      'description',
    ]);
  });
});
