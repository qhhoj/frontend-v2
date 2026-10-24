import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import { useProfileQuery } from '@/features/account/profile.queries';
import { uploadCapBytes } from '@/lib/source';

/**
 * Which allowed language is selected: the viewer's pick, else the account's language (whenever the profile loads),
 * else the first text language. A file-only language is never a default, only a pick. A pick the problem does not
 * allow (the problem changed under the form) counts as no pick. `onSwitch` runs when a pick changes the language.
 */
export function useSubmitLanguage(problem: Ref<ProblemDetail>, onSwitch: () => void) {
  const { data: profile } = useProfileQuery();
  const pickedLanguageId = ref<string | null>(null);
  const textLanguages = computed(() =>
    problem.value.allowedLanguages.filter((candidate) => !candidate.fileOnly),
  );
  const isAllowed = (id: string | null) =>
    problem.value.allowedLanguages.some((candidate) => candidate.id === id);
  const languageId = computed(
    () =>
      (isAllowed(pickedLanguageId.value) ? pickedLanguageId.value : null) ??
      textLanguages.value.find((candidate) => candidate.id === profile.value?.languageId)?.id ??
      textLanguages.value[0]?.id ??
      null,
  );
  const language = computed(
    () =>
      problem.value.allowedLanguages.find((candidate) => candidate.id === languageId.value) ?? null,
  );
  const fileMode = computed(() => language.value?.fileOnly ?? false);
  /** A file-only language with `fileSizeLimit` 0 takes no upload at all. */
  const uploadsOff = computed(
    () => fileMode.value && language.value !== null && uploadCapBytes(language.value) === 0,
  );
  /** The server-side row for this language's key, if the problem overrides the limits. */
  const languageLimits = computed(() =>
    problem.value.languageLimits.find((row) => row.language === language.value?.key),
  );
  const isPicked = computed(() => isAllowed(pickedLanguageId.value));

  function setLanguage(id: string) {
    const isSwitch = id !== languageId.value;
    pickedLanguageId.value = id; // also when equal to the default: a pick must outlive a late profile
    if (isSwitch) onSwitch();
  }
  /** Freezes the language as it is now, so a profile arriving later cannot change it under the viewer's code. */
  const keepLanguage = () => {
    pickedLanguageId.value ??= languageId.value;
  };
  return {
    languageId,
    language,
    fileMode,
    uploadsOff,
    languageLimits,
    isPicked,
    setLanguage,
    keepLanguage,
  };
}
