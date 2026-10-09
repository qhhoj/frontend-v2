import type { PreviewStyle } from '@/api/types/admin-common';
import type { EditableProblem } from '@/api/types/problem-editing';

export type StatementSlot = 'vi' | 'en' | 'original';
export const STATEMENT_SLOTS: readonly StatementSlot[] = ['vi', 'en', 'original'];

export interface StatementDraft {
  name: string;
  description: string;
  /** False for a language the problem has no translation for yet ("chưa có"). */
  exists: boolean;
}

/** A translation's draft, or the original description (`original`: always exists, its name is on the general tab). */
export function statementDraftOf(problem: EditableProblem, slot: StatementSlot): StatementDraft {
  const editor = problem.editor!;
  if (slot === 'original') {
    return { name: problem.name, description: editor.description, exists: true };
  }
  const translation = editor.translations.find((candidate) => candidate.language === slot);
  if (!translation) return { name: '', description: '', exists: false };
  return { name: translation.name, description: translation.description, exists: true };
}

/** `problem-full` only for a full-markup problem and a viewer allowed to see it; the backend refuses it otherwise. */
export const previewStyleFor = (problem: EditableProblem, canFullMarkup: boolean): PreviewStyle =>
  problem.isFullMarkup && canFullMarkup ? 'problem-full' : 'problem';

/** Backend: a full-markup problem's description is written only with `judge.problem_full_markup` (else 403). */
export const isOriginalLocked = (problem: EditableProblem, canFullMarkup: boolean): boolean =>
  problem.isFullMarkup && !canFullMarkup;

/** The text with an image line inserted at the caret, and the caret after it. */
export function insertImage(text: string, url: string, selectionEnd: number) {
  const snippet = `\n![](${url})\n`;
  return {
    text: text.slice(0, selectionEnd) + snippet + text.slice(selectionEnd),
    caret: selectionEnd + snippet.length,
  };
}
