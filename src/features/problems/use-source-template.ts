import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { Language } from '@/api/types/problems';

/**
 * Keeps the editor filled with the selected text language's template. A new language replaces the content only
 * while it is empty or still the template written last, so the viewer's own code is never lost. A file-only
 * language leaves the content alone for the way back.
 */
export function useSourceTemplate(language: Ref<Language | null>, source: Ref<string>) {
  /** Set after a replacement (not the first fill); the next edit by the viewer clears it. */
  const templateRestored = ref(false);
  let appliedTemplate: string | null = null;
  let isFirstFill = true;

  watch(
    language,
    (selected) => {
      if (!selected || selected.fileOnly) return;
      const mayReplace = source.value === '' || source.value === appliedTemplate;
      if (!mayReplace) return;
      templateRestored.value = !isFirstFill && source.value !== selected.template;
      isFirstFill = false;
      appliedTemplate = selected.template;
      source.value = selected.template;
    },
    { immediate: true },
  );
  watch(source, (text) => {
    if (text !== appliedTemplate) templateRestored.value = false;
  });
  return { templateRestored };
}
