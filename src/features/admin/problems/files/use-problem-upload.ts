import { ref } from 'vue';
import { uploadMaterial, uploadProblemImage, uploadStatementPdf } from '@/api/problem-editing.api';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

export type ProblemUploadKind = 'image' | 'pdf' | 'material';

const UPLOADERS: Record<ProblemUploadKind, (code: string, file: File) => Promise<string>> = {
  image: (_code, file) => uploadProblemImage(file),
  pdf: uploadStatementPdf,
  material: uploadMaterial,
};

/**
 * One problem upload: the address it returned. A PDF or material changes the stored address the detail shows,
 * so the detail is read again; an image is only ever returned, never listed.
 */
export function useProblemUpload(kind: ProblemUploadKind, code: () => string) {
  const url = ref('');
  const mutation = useAdminMutation({
    mutate: (file: File) => UPLOADERS[kind](code(), file),
    invalidates: (): AdminQueryKey[] => (kind === 'image' ? [] : [['admin', 'problem', code()]]),
    onDone: (uploaded: string) => {
      url.value = uploaded;
    },
  });
  return { url, mutation };
}
