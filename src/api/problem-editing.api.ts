import { apiGet, apiSend } from './typed';
import { fileBody } from './problem-data.api';
import type { StatementLanguage } from './types/problems';
import type {
  EditableProblem,
  EditorialDraftBody,
  ProblemBody,
  ProblemEditingMeta,
  ProblemPatch,
} from './types/problem-editing';

/**
 * The editor block comes with the detail for editors. The detail's `name` follows the requested language, so the forms read the
 * base-language name from `editor.baseName`; the general form sends `name` only when it was edited.
 */
export const fetchEditableProblem = (code: string): Promise<EditableProblem> =>
  apiGet('/problems/{code}', { path: { code } });
export const fetchProblemEditingMeta = (): Promise<ProblemEditingMeta> => apiGet('/problems/meta');
export const createProblem = (body: ProblemBody): Promise<EditableProblem> =>
  apiSend('post', '/problems', { body });
/** An organization-private problem of `slug` (organization administrators with `create_organization_problem`). */
export const createOrganizationProblem = (
  slug: string,
  body: ProblemBody,
): Promise<EditableProblem> =>
  apiSend('post', '/organizations/{slug}/problems', { path: { slug }, body });
export const suggestProblem = (body: ProblemBody): Promise<EditableProblem> =>
  apiSend('post', '/problems/suggest', { body });
export const updateProblem = (code: string, patch: ProblemPatch): Promise<EditableProblem> =>
  apiSend('patch', '/problems/{code}', { path: { code }, body: patch });
export const putTranslation = (
  code: string,
  lang: StatementLanguage,
  body: { name: string; description: string },
): Promise<void> =>
  apiSend('put', '/problems/{code}/translations/{lang}', { path: { code, lang }, body });
export const putEditorial = (code: string, body: EditorialDraftBody): Promise<void> =>
  apiSend('put', '/problems/{code}/editorial', { path: { code }, body });
export const cloneProblem = (code: string, newCode: string): Promise<EditableProblem> =>
  apiSend('post', '/problems/{code}/clone', { path: { code }, body: { code: newCode } });

export const uploadProblemImage = async (file: File): Promise<string> =>
  (await apiSend('post', '/problems/uploads/image', fileBody(file))).url;
export const uploadStatementPdf = async (code: string, file: File): Promise<string> =>
  (await apiSend('post', '/problems/{code}/statement', { path: { code }, ...fileBody(file) })).url;
export const uploadMaterial = async (code: string, file: File): Promise<string> =>
  (await apiSend('post', '/problems/{code}/material', { path: { code }, ...fileBody(file) })).url;
export const removeStatementPdf = (code: string) =>
  apiSend('delete', '/problems/{code}/statement', { path: { code } });
export const removeMaterial = (code: string) =>
  apiSend('delete', '/problems/{code}/material', { path: { code } });
