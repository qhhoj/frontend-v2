import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Language } from '@/api/types/problems';
import { formatFileSize } from '@/lib/format';
import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_LENGTH,
  acceptedExtension,
  checkUploadFile,
  readSourceFile,
  uploadCapBytes,
} from '@/lib/source';
import type { SubmitMessage } from './submit-message';

/**
 * The two files a form takes: an upload for a file-only language (`chooseFile`) and a text file read into the
 * editor (`loadFile`). A refused file keeps what was there before and reports through `report`.
 */
export function useSubmitFile(
  language: Ref<Language | null>,
  source: Ref<string>,
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

  async function loadFile(file: File) {
    const result = await readSourceFile(file);
    if (result.ok) {
      source.value = result.text;
      report(null);
      return;
    }
    report({
      key: `submit.file.${result.reason}`,
      params: { max: MAX_SOURCE_LENGTH, size: formatFileSize(MAX_SOURCE_BYTES) },
    });
  }
  return { chosenFile, chooseFile, clearFile, loadFile };
}
