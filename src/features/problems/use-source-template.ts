import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { Language } from '@/api/types/problems';

/**
 * Keeps the editor filled with the selected text language's template. A new language replaces the content only
 * while it is empty or still the template written last, so the viewer's own code is never lost. A file-only
 * language leaves the content alone for the way back. `isPicked`: the viewer chose a language themselves.
 */
export function useSourceTemplate(
  language: Ref<Language | null>,
  source: Ref<string>,
  isPicked: Ref<boolean>,
) {
  /** Set after a replacement the viewer caused; their next edit clears it. */
  const templateRestored = ref(false);
  const appliedTemplate = ref<string | null>(null);
  let isFirstFill = true;
  /** The editor holds something the viewer wrote (or loaded), not a template. */
  const hasViewerCode = computed(
    () => source.value !== '' && source.value !== appliedTemplate.value,
  );

  watch(
    language,
    (selected) => {
      if (!selected || selected.fileOnly) return;
      if (hasViewerCode.value) return;
      templateRestored.value = !isFirstFill && isPicked.value && source.value !== selected.template;
      isFirstFill = false;
      appliedTemplate.value = selected.template;
      source.value = selected.template;
    },
    { immediate: true },
  );
  watch(source, (text) => {
    if (text !== appliedTemplate.value) templateRestored.value = false;
  });
  return { templateRestored, hasViewerCode };
}
