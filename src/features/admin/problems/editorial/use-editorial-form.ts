import { computed } from 'vue';
import type { ApiError } from '@/api/client';
import { putEditorial } from '@/api/problem-editing.api';
import type { UserChip } from '@/api/types/admin-common';
import type { EditableProblem, EditorialDraftBody } from '@/api/types/problem-editing';
import { normalizeNewlines, sentText, useDirtyForm } from '../../ui/form/dirty-form';
import { useSeededDraft } from '../../ui/form/seeded-draft';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { markdownError } from '../statements/statement-drafts';

export interface EditorialForm {
  isPublic: boolean;
  /** ISO instant; null = publish from the moment it is saved. */
  publishOn: string | null;
  authors: UserChip[];
  content: string;
}

type StoredEditorial = NonNullable<EditableProblem['editor']>['solution'];
const formOf = (stored: StoredEditorial | undefined): EditorialForm => ({
  isPublic: stored?.isPublic ?? false,
  publishOn: stored?.publishOn ?? null,
  authors: (stored?.authors ?? []).map(({ id, username }) => ({ id, username })),
  content: normalizeNewlines(stored?.content ?? ''),
});

/**
 * The editorial inside the statement section: public flag, release time, authors and the Markdown. The page's one save
 * calls `validate()` and then `saveTo()`. A clean form follows the stored editorial, so a later save never sends back what
 * someone else changed meanwhile; a rename of the problem keeps the edits (`retarget`).
 */
export function useEditorialForm(problem: () => EditableProblem) {
  const { draft, dirtyCount, discard, commit } = useDirtyForm<EditorialForm>(
    formOf(problem().editor?.solution),
  );
  /** The content as stored (maybe `\r\n`): sent back while the edit leaves it unchanged. */
  let storedContent = problem().editor?.solution?.content ?? '';
  const { retarget } = useSeededDraft(problem, {
    idOf: (stored) => stored.code,
    routeParam: 'code',
    isDirty: () => dirtyCount.value > 0,
    refill: (stored) => {
      storedContent = stored.editor?.solution?.content ?? '';
      commit(formOf(stored.editor?.solution));
    },
  });
  const contentError = computed(() => markdownError(draft.value.content));
  const mutation = useAdminMutation({
    mutate: ({ code, body }: { code: string; body: EditorialDraftBody }) =>
      putEditorial(code, body),
    invalidates: ({ code }) => [['admin', 'problem', code], PUBLIC_PROBLEMS_KEY],
  });

  const validate = () => !contentError.value;

  /** Sends the editorial to the problem `code`: null when saved, else the refusal. */
  async function saveTo(code: string): Promise<ApiError | null> {
    const sent = { ...draft.value, authors: [...draft.value.authors] };
    const content = sentText(sent.content, storedContent);
    const body = {
      isPublic: sent.isPublic,
      publishOn: sent.publishOn ?? new Date().toISOString(),
      authors: sent.authors.map((chip) => chip.id),
      content,
    };
    await mutation.run({ code, body });
    if (mutation.failure.value) return mutation.failure.value;
    storedContent = content;
    commit(sent);
    return null;
  }

  return { draft, dirtyCount, contentError, validate, saveTo, retarget, discard };
}
