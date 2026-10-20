<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import LanguageIcon from '@/components/language/LanguageIcon.vue';
import { languageById } from '@/components/language/language-by-id';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { translate } from '@/i18n';
import type { SubmissionFilters } from './use-submission-filters';

/** The one-language filter: "Mọi ngôn ngữ" or one of `languages`. In the chip row from sm, in the filter panel on a phone. */
const props = defineProps<{ filters: SubmissionFilters; languages: Language[] }>();
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>] }>();
const ANY_LANGUAGE = '';
const options = computed(() => [
  { value: ANY_LANGUAGE, label: translate('submissions.rail.anyLanguage') },
  ...props.languages.map((language) => ({ value: language.id, label: language.name })),
]);
const chosen = computed(() => {
  const languageId = props.filters.languageIds[0];
  return languageId === undefined ? undefined : languageById(props.languages, languageId);
});
const pick = (languageId: string) =>
  emit('update', { languageIds: languageId === ANY_LANGUAGE ? [] : [languageId] });
</script>

<template>
  <ToolbarSelect
    :label="$t('submissions.rail.language')"
    :model-value="filters.languageIds[0] ?? ANY_LANGUAGE"
    :options="options"
    :active="filters.languageIds.length > 0"
    @update:model-value="pick"
  >
    <template #chosen-icon><LanguageIcon v-if="chosen" :language-key="chosen.key" /></template>
  </ToolbarSelect>
</template>
