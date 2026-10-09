import { apiRequest } from './client';
import type {
  CreateLanguageBody,
  LanguageAdmin,
  UpdateLanguageBody,
} from './types/languages-admin';

/** Backend `LanguagesAdminController` (`judge.change_language`). */
export const fetchLanguagesAdmin = () => apiRequest<LanguageAdmin[]>('/admin/languages');
export const createLanguage = (body: CreateLanguageBody) =>
  apiRequest<LanguageAdmin>('/admin/languages', { method: 'POST', body });
export const updateLanguage = (id: string, patch: UpdateLanguageBody) =>
  apiRequest<LanguageAdmin>(`/admin/languages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
