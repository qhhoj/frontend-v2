<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import FilterToggle from '@/features/problems/FilterToggle.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdvancedFiltersButton from './AdvancedFiltersButton.vue';
import { isQuickFilterOn, quickFilterPatch } from './quick-filters';
import type { QuickFilter } from './quick-filters';
import type { SubmissionFilters } from './use-submission-filters';

/**
 * The chips above the list: Của tôi (signed-in viewers), AC, Lỗi, Đang chấm, the language, and the button that opens
 * the advanced filters. Every chip only edits `filters`, so the URL stays the one source of truth.
 */
const props = defineProps<{
  filters: SubmissionFilters;
  languages: Language[];
  /** The signed-in viewer's username; null hides "Của tôi". */
  username: string | null;
  /** Submissions queued or being judged now, shown on "Đang chấm". */
  gradingCount: number | undefined;
  advancedOpen: boolean;
  /** Filters set only in the advanced panel, counted on its button. */
  advancedCount: number;
  panelId: string;
}>();
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>]; toggleAdvanced: [] }>();
const locale = useLocaleStore();

const chips = computed(() =>
  (['mine', 'accepted', 'errors', 'grading'] as const satisfies readonly QuickFilter[]).filter(
    (chip) => chip !== 'mine' || props.username !== null,
  ),
);
const isOn = (chip: QuickFilter) => isQuickFilterOn(props.filters, chip, props.username);
const toggle = (chip: QuickFilter) =>
  emit('update', quickFilterPatch(props.filters, chip, props.username));

const ANY_LANGUAGE = '';
const languageOptions = computed(() => [
  { value: ANY_LANGUAGE, label: translate('submissions.rail.anyLanguage') },
  ...props.languages.map((language) => ({ value: language.id, label: language.name })),
]);
const pickLanguage = (languageId: string) =>
  emit('update', { languageIds: languageId === ANY_LANGUAGE ? [] : [languageId] });
</script>

<template>
  <div
    role="search"
    :aria-label="$t('submissions.rail.title')"
    class="flex flex-wrap items-center gap-2"
  >
    <FilterToggle
      v-for="chip in chips"
      :key="chip"
      :data-quick-filter="chip"
      :pressed="isOn(chip)"
      @toggle="toggle(chip)"
    >
      {{ $t(`submissions.quick.${chip}`) }}
      <span
        v-if="chip === 'grading' && gradingCount"
        class="font-mono text-xs tabular-nums opacity-80"
        >{{ formatNumber(gradingCount, locale.locale) }}</span
      >
    </FilterToggle>
    <ToolbarSelect
      :label="$t('submissions.rail.language')"
      :model-value="filters.languageIds[0] ?? ANY_LANGUAGE"
      :options="languageOptions"
      :active="filters.languageIds.length > 0"
      @update:model-value="pickLanguage"
    />
    <AdvancedFiltersButton
      :open="advancedOpen"
      :count="advancedCount"
      :panel-id="panelId"
      @toggle="emit('toggleAdvanced')"
    />
  </div>
</template>
