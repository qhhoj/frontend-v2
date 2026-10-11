import type {
  ExternalJudgeLanguage,
  ExternalJudgeLinkBody,
  ExternalJudgeVerifiedLanguage,
} from '@/api/types/external-judge';

/** Remote language id to the chosen site language id; `''` means "not used". */
export type LanguageMapping = Record<string, string>;

/** The site language of a suggestion, unless an earlier remote language already took it. */
export function mappingFromVerified(
  languages: ExternalJudgeVerifiedLanguage[],
  current: LanguageMapping = {},
): LanguageMapping {
  const mapping: LanguageMapping = {};
  const taken = new Set<string>();
  for (const language of languages) {
    const chosen = current[language.remoteId] ?? language.suggestedLanguageId ?? '';
    mapping[language.remoteId] = chosen !== '' && !taken.has(chosen) ? chosen : '';
    if (mapping[language.remoteId] !== '') taken.add(chosen);
  }
  return mapping;
}

export function mappingFromLink(languages: ExternalJudgeLanguage[]): LanguageMapping {
  return Object.fromEntries(languages.map((language) => [language.remoteId, language.languageId]));
}

/** Site language ids chosen for more than one remote language. */
export function duplicateSiteLanguages(mapping: LanguageMapping): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const siteLanguageId of Object.values(mapping)) {
    if (siteLanguageId === '') continue;
    if (seen.has(siteLanguageId)) duplicates.add(siteLanguageId);
    seen.add(siteLanguageId);
  }
  return duplicates;
}

interface LinkDraft {
  isActive: boolean;
  oj: string;
  problemId: string;
  title: string;
  remoteLanguages: { remoteId: string; remoteName: string }[];
  mapping: LanguageMapping;
}

/** One row per remote language that has a site language; the title stamps the link as verified. */
export function linkBodyOf(draft: LinkDraft): ExternalJudgeLinkBody {
  const languages = draft.remoteLanguages
    .filter((language) => (draft.mapping[language.remoteId] ?? '') !== '')
    .map((language) => ({
      languageId: draft.mapping[language.remoteId]!,
      remoteId: language.remoteId,
      remoteName: language.remoteName,
    }));
  return {
    isActive: draft.isActive,
    oj: draft.oj.trim(),
    problemId: draft.problemId.trim(),
    ...(draft.title === '' ? {} : { title: draft.title }),
    languages,
  };
}
