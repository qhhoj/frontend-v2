import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Language } from '@/api/types/problems';
import { formatFileSize } from '@/lib/format';
import { acceptedExtension, checkUploadFile, uploadCapBytes } from '@/lib/source';
import type { SubmitMessage } from './submit-message';

/** The file a file-only language submits. A refused file keeps the previous choice and reports through `report`. */
export function useSubmitFile(
  language: Ref<Language | null>,
  report: (message: SubmitMessage | null) => void,
) {
  const chosenFile = ref<File | null>(null);

  function chooseFile(file: File) {
    if (!language.value) return;
    const check = checkUploadFile(file, language.value);
    if (check.ok) {
      chosenFile.value = file;
      report(null);
      return;
    }
    report({
      key: `submit.file.${check.reason}`,
      params: {
        extension: acceptedExtension(language.value),
        size: formatFileSize(uploadCapBytes(language.value)),
      },
    });
  }
  const clearFile = () => (chosenFile.value = null);
  return { chosenFile, chooseFile, clearFile };
}
