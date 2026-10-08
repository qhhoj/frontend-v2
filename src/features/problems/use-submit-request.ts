import { ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { submit, submitFile } from '@/api/submissions.api';
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
  report: (message: SubmitMessage | null) => void;
}

/** The submit request (JSON for text, multipart for a file) and what follows: the submission page or the error. */
export function useSubmitRequest(input: SubmitRequestInput) {
  const router = useRouter();
  const submitting = ref(false);
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
      await router.push({ name: 'submission', params: { id } });
    } catch (error) {
      input.report(submitErrorKey(error));
    } finally {
      submitting.value = false;
    }
  }
  return { submitting, submitNow };
}
