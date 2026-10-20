import { computed } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useProblemMetaQuery } from './problems.queries';

/**
 * Judge keys (for `LanguageIcon`) of rows that carry only a language id (contest stats) or the pp table's short name, read
 * from the cached problem meta, read only once `needed` (there are rows to label). `null` until the meta loads or when
 * nothing matches: the icon is then the generic one.
 */
export function useLanguageKeys(needed: MaybeRefOrGetter<boolean>) {
  const meta = useProblemMetaQuery({ enabled: needed });
  const languages = computed(() => meta.data.value?.languages ?? []);
  return {
    keyOfId: (id: string) => languages.value.find((language) => language.id === id)?.key ?? null,
    /** The pp table names a language by its short name, or its key when it has none. */
    keyOfShortName: (name: string) =>
      languages.value.find((language) => (language.shortName || language.key) === name)?.key ??
      null,
  };
}
