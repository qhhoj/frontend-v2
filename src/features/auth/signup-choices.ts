import type { Language } from '@/api/types/problems';

/** The optional ids of a signup; `''` means "not chosen", and the backend must not see it (UUID validation). */
export interface SignupChoiceIds {
  organizationId: string;
  languageId: string;
}

/** The language a new account starts with (ruling 2026-10-08). */
export const DEFAULT_LANGUAGE_KEY = 'CPP17';

/** The id a picker starts at, or `''` ("Chưa chọn") when the list has no default language. */
export const defaultLanguageId = (languages: Language[]): string =>
  languages.find((language) => language.key === DEFAULT_LANGUAGE_KEY)?.id ?? '';

/** Only the ids that were chosen; the backend never sees an empty one. */
export const chosenIds = ({ organizationId, languageId }: SignupChoiceIds) => {
  const ids: Partial<SignupChoiceIds> = {};
  if (organizationId) ids.organizationId = organizationId;
  if (languageId) ids.languageId = languageId;
  return ids;
};
