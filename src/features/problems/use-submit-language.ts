import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import { useProfileQuery } from '@/features/account/profile.queries';
import { uploadCapBytes } from '@/lib/source';

/**
 * Which allowed language is selected: the viewer's pick, else the account's language (whenever the profile loads),
 * else the first text language. A file-only language is never a default, only a pick.
 */
export function useSubmitLanguage(problem: Ref<ProblemDetail>) {
  const { data: profile } = useProfileQuery();
  const pickedLanguageId = ref<string | null>(null);
  const textLanguages = computed(() =>
    problem.value.allowedLanguages.filter((candidate) => !candidate.fileOnly),
  );
  const languageId = computed(
    () =>
      pickedLanguageId.value ??
      textLanguages.value.find((candidate) => candidate.id === profile.value?.languageId)?.id ??
      textLanguages.value[0]?.id ??
      null,
  );
  const language = computed(
    () =>
      problem.value.allowedLanguages.find((candidate) => candidate.id === languageId.value) ?? null,
  );
  const fileMode = computed(() => language.value?.fileOnly ?? false);
  /** B17: a file-only language with `fileSizeLimit` 0 takes no upload at all. */
  const uploadsOff = computed(
    () => fileMode.value && language.value !== null && uploadCapBytes(language.value) === 0,
  );
  /** The server-side row for this language's key, if the problem overrides the limits. */
  const languageLimits = computed(() =>
    problem.value.languageLimits.find((row) => row.language === language.value?.key),
  );
  const setLanguage = (id: string) => (pickedLanguageId.value = id);
  return { languageId, language, fileMode, uploadsOff, languageLimits, setLanguage };
}
