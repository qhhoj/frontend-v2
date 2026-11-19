import { apiGet, apiSend } from './typed';
import type { CreateLanguageBody, UpdateLanguageBody } from './types/languages-admin';

/** Backend `LanguagesAdminController` (`judge.change_language`). */
export const fetchLanguagesAdmin = () => apiGet('/admin/languages');
/** Per language: problems that allow it and submissions over the last 30 days; an unused language is absent. */
export const fetchLanguageUsage = () => apiGet('/admin/languages/usage');
export const createLanguage = (body: CreateLanguageBody) =>
  apiSend('post', '/admin/languages', { body });
export const updateLanguage = (id: string, patch: UpdateLanguageBody) =>
  apiSend('patch', '/admin/languages/{id}', { path: { id }, body: patch });
