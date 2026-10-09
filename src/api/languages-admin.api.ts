import { apiRequest } from './client';
import type { LanguageAdmin } from './types/languages-admin';

/** Backend `LanguagesAdminController` (`judge.change_language`). */
export const fetchLanguagesAdmin = () => apiRequest<LanguageAdmin[]>('/admin/languages');
