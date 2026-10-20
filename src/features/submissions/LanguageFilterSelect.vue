<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import LanguageIcon from '@/components/language/LanguageIcon.vue';
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
const chosen = computed(() =>
  props.languages.find((language) => language.id === props.filters.languageIds[0]),
);
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
    <template v-if="chosen" #chosen-icon><LanguageIcon :language-key="chosen.key" /></template>
  </ToolbarSelect>
</template>
