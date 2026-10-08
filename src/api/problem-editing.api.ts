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
 * P1: the editor block comes with the detail for editors. `lang=en` is the base language: the detail returns the requested language's
 * translation when one exists, so `lang=vi` would put the Vietnamese name on top and a saved `name` would overwrite the base name.
 * Even so, `name` is the English translation when one exists; the general form therefore sends `name` only when it was edited (Task 5).
 */
export const fetchEditableProblem = (code: string) =>
  apiRequest<EditableProblem>(problemPath(code), { query: { lang: 'en' } });
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
