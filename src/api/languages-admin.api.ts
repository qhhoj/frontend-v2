import { apiGet, apiSend } from './typed';
import type { CreateLanguageBody, UpdateLanguageBody } from './types/languages-admin';

/** Backend `LanguagesAdminController` (`judge.change_language`). */
export const fetchLanguagesAdmin = () => apiGet('/admin/languages');
export const createLanguage = (body: CreateLanguageBody) =>
  apiSend('post', '/admin/languages', { body });
export const updateLanguage = (id: string, patch: UpdateLanguageBody) =>
  apiSend('patch', '/admin/languages/{id}', { path: { id }, body: patch });
