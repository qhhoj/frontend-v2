import { nextTick } from 'vue';
import type { Ref } from 'vue';
import { uploadProblemImage } from '@/api/problem-editing.api';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { insertImage } from './statement-drafts';
import type { StatementDraft } from './statement-drafts';

/** Uploads a picked image and puts its URL into the text at the caret of the markdown box (the kit owns that box). */
export function useImageInsert(
  draft: Ref<StatementDraft>,
  textareaOf: () => HTMLTextAreaElement | undefined,
) {
  async function insertAtCaret(url: string) {
    const textarea = textareaOf();
    const caretAtEnd = draft.value.description.length;
    const { text, caret } = insertImage(
      draft.value.description,
      url,
      textarea?.selectionEnd ?? caretAtEnd,
    );
    draft.value.description = text;
    await nextTick();
    textareaOf()?.setSelectionRange(caret, caret);
  }

  return useAdminMutation({
    mutate: (file: File) => uploadProblemImage(file),
    onDone: (url: string) => {
      void insertAtCaret(url);
    },
  });
}
