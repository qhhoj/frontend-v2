/** The language with `id` in `languages` (public meta or admin list), or `undefined` when it is not listed. */
export const languageById = <T extends { id: string }>(
  languages: readonly T[],
  id: string,
): T | undefined => languages.find((language) => language.id === id);
