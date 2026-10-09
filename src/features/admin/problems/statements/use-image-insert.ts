import { nextTick } from 'vue';
import type { Ref } from 'vue';
import { uploadProblemImage } from '@/api/problem-editing.api';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { insertImage } from './statement-drafts';
import type { StatementDraft, StatementSlot } from './statement-drafts';

interface ImageUpload {
  file: File;
  /** The language the upload started in: the URL goes there, even if the viewer switches language meanwhile. */
  target: StatementSlot;
}

/** Uploads a picked image and puts its URL into the draft it was picked for (the markdown box is the kit's, so the caret is read from its textarea). */
export function useImageInsert(
  drafts: Ref<Record<StatementSlot, StatementDraft>>,
  slot: Ref<StatementSlot>,
  textareaOf: () => HTMLTextAreaElement | undefined,
) {
  async function insertInto(target: StatementSlot, url: string) {
    const draft = drafts.value[target];
    const isShown = slot.value === target;
    const caret = isShown
      ? (textareaOf()?.selectionEnd ?? draft.description.length)
      : draft.description.length;
    const inserted = insertImage(draft.description, url, caret);
    draft.description = inserted.text;
    if (!isShown) return;
    await nextTick();
    textareaOf()?.setSelectionRange(inserted.caret, inserted.caret);
  }

  const mutation = useAdminMutation({
    mutate: ({ file }: ImageUpload) => uploadProblemImage(file),
    onDone: (url: string, { target }: ImageUpload) => {
      void insertInto(target, url);
    },
  });

  return {
    isPending: mutation.isPending,
    failure: mutation.failure,
    upload: (file: File) => mutation.run({ file, target: slot.value }),
  };
}
