import { useQueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { submit, submitFile } from '@/api/submissions.api';
import { newSubmissionListKeys } from '@/features/submissions/list/submission-scope';
import { submitErrorKey } from '@/lib/source';
import type { SubmitMessage } from './submit-message';

interface SubmitRequestInput {
  problemCode: Ref<string>;
  languageId: Ref<string | null>;
  fileMode: Ref<boolean>;
  source: Ref<string>;
  chosenFile: Ref<File | null>;
  /** Everything but `submitting` that must hold before a request may leave. */
  isReady: Ref<boolean>;
  /** A contest problem: a submit spends one of its attempts, which the problem detail counts. */
  isContest: Ref<boolean>;
  report: (message: SubmitMessage | null) => void;
}

/**
 * The submit request (JSON for text, multipart for a file) and what follows (Q-01 B): the viewer stays on the problem
 * and `lastSubmissionId` names the new submission for the live result strip, or the error shows.
 */
export function useSubmitRequest(input: SubmitRequestInput) {
  const queryClient = useQueryClient();
  const submitting = ref(false);
  const lastSubmissionId = ref<string | null>(null);
  const { problemCode, languageId, source, chosenFile } = input;
  const send = () =>
    input.fileMode.value
      ? submitFile(problemCode.value, { language: languageId.value!, file: chosenFile.value! })
      : submit(problemCode.value, { language: languageId.value!, source: source.value });

  /** The `submitting` flag is set before the first await, so a double click sends one request. */
  async function submitNow() {
    if (submitting.value || !input.isReady.value) return;
    submitting.value = true;
    input.report(null);
    try {
      const { id } = await send();
      lastSubmissionId.value = id;
      // The new row joins the viewer's lists; in a contest, the attempts left drop.
      for (const queryKey of newSubmissionListKeys())
        void queryClient.invalidateQueries({ queryKey });
      if (input.isContest.value)
        void queryClient.invalidateQueries({ queryKey: ['problems', 'detail'] });
    } catch (error) {
      input.report(submitErrorKey(error));
    } finally {
      submitting.value = false;
    }
  }
  return { submitting, lastSubmissionId, submitNow };
}
