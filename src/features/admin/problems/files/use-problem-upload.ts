import { ref } from 'vue';
import {
  removeMaterial,
  removeStatementPdf,
  uploadMaterial,
  uploadProblemImage,
  uploadStatementPdf,
} from '@/api/problem-editing.api';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

export type ProblemUploadKind = 'image' | 'pdf' | 'material';
/** The kinds a problem keeps one file of, which can be removed. */
export type ProblemFileKind = Exclude<ProblemUploadKind, 'image'>;

const UPLOADERS: Record<ProblemUploadKind, (code: string, file: File) => Promise<string>> = {
  image: (_code, file) => uploadProblemImage(file),
  pdf: uploadStatementPdf,
  material: uploadMaterial,
};
const REMOVERS: Record<ProblemFileKind, (code: string) => Promise<unknown>> = {
  pdf: removeStatementPdf,
  material: removeMaterial,
};

/**
 * One problem upload: the address it returned. A PDF or material changes the stored address the detail shows,
 * so the detail is read again (after an upload or a removal); an image is only ever returned, never listed.
 */
export function useProblemUpload(kind: ProblemUploadKind, code: () => string) {
  const url = ref('');
  const invalidates = (): AdminQueryKey[] =>
    kind === 'image' ? [] : [['admin', 'problem', code()], PUBLIC_PROBLEMS_KEY];
  const mutation = useAdminMutation({
    mutate: (file: File) => UPLOADERS[kind](code(), file),
    invalidates,
    onDone: (uploaded: string) => {
      url.value = uploaded;
    },
  });
  const removal = useAdminMutation({
    mutate: () => (kind === 'image' ? Promise.resolve() : REMOVERS[kind](code())),
    invalidates,
    onDone: () => {
      url.value = '';
    },
  });
  return { url, mutation, removal };
}
