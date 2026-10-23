import type { PreviewStyle } from '@/api/types/admin-common';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import { normalizeNewlines, sentText } from '../../ui/form/dirty-form';
import {
  DISALLOWED_STATEMENT_CHARACTERS,
  MARKDOWN_MAX_LENGTH,
  STATEMENT_NAME_MAX_LENGTH,
} from '../limits';
import type { EditableProblem } from '@/api/types/problem-editing';

export type StatementSlot = 'vi' | 'en' | 'original';
export const STATEMENT_SLOTS: readonly StatementSlot[] = ['vi', 'en', 'original'];

export interface StatementDraft {
  name: string;
  description: string;
  /** False for a language the problem has no translation for yet ("chưa có"). */
  exists: boolean;
  /** The description as the backend stores it (maybe `\r\n`): sent back while the edit leaves it unchanged. */
  storedDescription: string;
}

const storedDraft = (name: string, description: string): StatementDraft => ({
  name,
  description: normalizeNewlines(description),
  exists: true,
  storedDescription: description,
});

/**
 * A translation's draft, or the original description (`original`: always exists, its name is on the general tab). A missing
 * translation starts with the problem's name, so writing it never means typing the title again. Descriptions come with the
 * textarea's line breaks, so legacy `\r\n` text is not a change.
 */
export function statementDraftOf(problem: EditableProblem, slot: StatementSlot): StatementDraft {
  const editor = problem.editor!;
  if (slot === 'original') {
    return storedDraft(editor.baseName, editor.description);
  }
  const translation = editor.translations.find((candidate) => candidate.language === slot);
  if (!translation)
    return { name: editor.baseName, description: '', exists: false, storedDescription: '' };
  return storedDraft(translation.name, translation.description);
}

/** The description a save of the draft sends: the stored text while only its line breaks differ. */
export const sentDescription = (draft: StatementDraft): string =>
  sentText(draft.description, draft.storedDescription);

/** The slot the tab opens on: the Vietnamese translation when there is one, else the base statement (never an empty "chưa có"). */
export const initialSlotOf = (problem: EditableProblem): StatementSlot =>
  problem.editor!.translations.some((translation) => translation.language === 'vi')
    ? 'vi'
    : 'original';

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

/** The text message for a markdown body the backend would refuse (length, legacy typographic characters), or undefined. */
export function markdownError(text: string): string | undefined {
  if (text.length > MARKDOWN_MAX_LENGTH)
    return translate('admin.problems.statements.errors.descriptionLength', {
      max: MARKDOWN_MAX_LENGTH,
    });
  const character = DISALLOWED_STATEMENT_CHARACTERS.find((candidate) => text.includes(candidate));
  return character
    ? translate('admin.problems.statements.errors.character', { character })
    : undefined;
}

/** A translation's name is 1 to 100 characters; the description follows `markdownError`. The original description has no name. */
export function checkStatementDraft(draft: StatementDraft, slot: StatementSlot): FieldErrors {
  const errors: FieldErrors = {};
  if (
    slot !== 'original' &&
    (draft.name.length < 1 || draft.name.length > STATEMENT_NAME_MAX_LENGTH)
  )
    errors.name = translate('admin.problems.statements.errors.nameLength', {
      max: STATEMENT_NAME_MAX_LENGTH,
    });
  const descriptionError = markdownError(draft.description);
  if (descriptionError) errors.description = descriptionError;
  return errors;
}

/**
 * The errors on screen: a field's own once its text differs from the saved one, every field's once a save of the slot was
 * tried. An opened but untouched slot (a missing translation's empty name) shows none.
 */
export function visibleStatementErrors(
  errors: FieldErrors,
  draft: StatementDraft,
  saved: StatementDraft,
  isSaveTried: boolean,
): FieldErrors {
  if (isSaveTried) return errors;
  const visible: FieldErrors = {};
  if (errors.name && draft.name !== saved.name) visible.name = errors.name;
  if (errors.description && draft.description !== saved.description)
    visible.description = errors.description;
  return visible;
}

/** Which statements a problem has: a slot counts once its description is written ("VI ✓ · EN — · Gốc ✓"). */
export function writtenSlots(problem: EditableProblem): Record<StatementSlot, boolean> {
  const isWritten = (slot: StatementSlot) =>
    statementDraftOf(problem, slot).description.trim() !== '';
  return { vi: isWritten('vi'), en: isWritten('en'), original: isWritten('original') };
}
