import { computed, ref, shallowRef } from 'vue';
import type { Ref } from 'vue';
import { submit, submitFile } from '@/api/submissions.api';
import type { ProblemDetail } from '@/api/types/problems';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_LENGTH,
  codePointCount,
  readSourceFile,
  submitErrorKey,
} from '@/lib/source';
import { useRouter } from 'vue-router';
import type { SubmitMessage } from './submit-message';
import { useResubmitPrefill } from './use-resubmit-prefill';
import type { ResubmitPrefill } from './use-resubmit-prefill';
import { useSourceTemplate } from './use-source-template';
import { useSubmitFile } from './use-submit-file';
import { useSubmitLanguage } from './use-submit-language';

/**
 * State of the submit form, shared by the desktop dock and the phone sheet. One composable per concern lives in
 * its own file (language, template, file, resubmit); this one adds the limits and the submit request.
 */
export function useSubmitForm(problem: Ref<ProblemDetail>, resubmitId: Ref<string | null>) {
  const router = useRouter();
  const source = ref('');
  const errorMessage = shallowRef<SubmitMessage | null>(null);
  const {
    languageId,
    language,
    fileMode,
    uploadsOff,
    languageLimits,
    setLanguage: pickLanguage,
  } = useSubmitLanguage(problem);
  const { templateRestored } = useSourceTemplate(language, source);
  const { chosenFile, chooseFile, clearFile } = useSubmitFile(language, (message) => {
    errorMessage.value = message;
  });

  const length = computed(() => codePointCount(source.value));
  const tooLong = computed(() => length.value > MAX_SOURCE_LENGTH);
  /** B19: `null` means the contest sets no cap. */
  const attemptsLeft = computed(() => problem.value.contest?.attemptsLeft ?? null);
  const submitting = ref(false);
  const hasInput = computed(() =>
    fileMode.value ? chosenFile.value !== null : length.value > 0 && !tooLong.value,
  );
  const canSubmit = computed(
    () =>
      !submitting.value &&
      languageId.value !== null &&
      !uploadsOff.value &&
      attemptsLeft.value !== 0 &&
      hasInput.value,
  );

  /** A file belongs to the language it was checked against (extension and size cap), so a real switch drops it. */
  function setLanguage(id: string) {
    const isSwitch = id !== languageId.value;
    pickLanguage(id); // also when equal to the default: a pick must outlive a late profile
    if (isSwitch) clearFile();
  }

  /** Replaces the editor with a text file; a refusal leaves the code as it was. */
  async function loadFile(file: File) {
    const result = await readSourceFile(file);
    if (result.ok) {
      source.value = result.text;
      errorMessage.value = null;
      return;
    }
    errorMessage.value = {
      key: `submit.file.${result.reason}`,
      params: { max: MAX_SOURCE_LENGTH, size: formatFileSize(MAX_SOURCE_BYTES) },
    };
  }

  const sendSubmission = () =>
    fileMode.value
      ? submitFile(problem.value.code, { language: languageId.value!, file: chosenFile.value! })
      : submit(problem.value.code, { language: languageId.value!, source: source.value });
  /** The `submitting` flag is set before the first await, so a double click sends one request. */
  async function submitNow() {
    if (!canSubmit.value) return;
    submitting.value = true;
    errorMessage.value = null;
    try {
      const { id } = await sendSubmission();
      await router.push({ name: 'submission', params: { id } });
    } catch (error) {
      errorMessage.value = submitErrorKey(error);
    } finally {
      submitting.value = false;
    }
  }

  // Source before language: the template rule must see the old code as the viewer's own.
  function prefill(earlier: ResubmitPrefill) {
    source.value = earlier.source;
    const isAllowed = problem.value.allowedLanguages.some(({ id }) => id === earlier.languageId);
    if (isAllowed) setLanguage(earlier.languageId!);
  }
  const { resubmitUnavailable } = useResubmitPrefill(resubmitId, prefill);

  const errorText = computed(() =>
    errorMessage.value ? translate(errorMessage.value.key, errorMessage.value.params ?? {}) : null,
  );
  return {
    language,
    languageId,
    languageLimits,
    source,
    fileMode,
    uploadsOff,
    chosenFile,
    templateRestored,
    setLanguage,
    loadFile,
    chooseFile,
    clearFile,
    canSubmit,
    length,
    tooLong,
    attemptsLeft,
    submitting,
    errorText,
    resubmitUnavailable,
    submitNow,
  };
}
