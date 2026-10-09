import { apiRequest } from './client';
import type { StatementLanguage } from './types/problems';
import type {
  EditableProblem,
  EditorialDraftBody,
  ProblemBody,
  ProblemEditingMeta,
  ProblemPatch,
} from './types/problem-editing';

const problemPath = (code: string) => `/problems/${encodeURIComponent(code)}`;

const uploadTo = async (path: string, file: File): Promise<string> => {
  const body = new FormData();
  body.append('file', file);
  return (await apiRequest<{ url: string }>(path, { method: 'POST', body })).url;
};

/**
 * The editor block comes with the detail for editors. The detail's `name` follows the requested language, so the forms read the
 * base-language name from `editor.baseName`; the general form sends `name` only when it was edited.
 */
export const fetchEditableProblem = (code: string) =>
  apiRequest<EditableProblem>(problemPath(code));
export const fetchProblemEditingMeta = () => apiRequest<ProblemEditingMeta>('/problems/meta');
export const createProblem = (body: ProblemBody) =>
  apiRequest<EditableProblem>('/problems', { method: 'POST', body });
export const suggestProblem = (body: ProblemBody) =>
  apiRequest<EditableProblem>('/problems/suggest', { method: 'POST', body });
export const updateProblem = (code: string, patch: ProblemPatch) =>
  apiRequest<EditableProblem>(problemPath(code), { method: 'PATCH', body: patch });
export const putTranslation = (
  code: string,
  language: StatementLanguage,
  body: { name: string; description: string },
) => apiRequest<void>(`${problemPath(code)}/translations/${language}`, { method: 'PUT', body });
export const putEditorial = (code: string, body: EditorialDraftBody) =>
  apiRequest<void>(`${problemPath(code)}/editorial`, { method: 'PUT', body });
export const cloneProblem = (code: string, newCode: string) =>
  apiRequest<EditableProblem>(`${problemPath(code)}/clone`, {
    method: 'POST',
    body: { code: newCode },
  });
export const uploadProblemImage = (file: File) => uploadTo('/problems/uploads/image', file);
export const uploadStatementPdf = (code: string, file: File) =>
  uploadTo(`${problemPath(code)}/statement`, file);
export const uploadMaterial = (code: string, file: File) =>
  uploadTo(`${problemPath(code)}/material`, file);
