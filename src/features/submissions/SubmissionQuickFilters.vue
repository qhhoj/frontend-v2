<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import Lamp from '@/components/ui/Lamp.vue';
import type { VerdictTone } from '@/lib/verdicts';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdvancedFiltersButton from './AdvancedFiltersButton.vue';
import LanguageFilterSelect from './LanguageFilterSelect.vue';
import { isQuickFilterOn, quickFilterPatch } from './quick-filters';
import type { QuickFilter } from './quick-filters';
import type { SubmissionFilters } from './use-submission-filters';

/**
 * The filter toggles above the list: Tất cả, Của tôi (signed-in viewers), AC, Lỗi, Đang chấm (each result toggle with
 * its lamp), then the language (in the panel on a phone) and the button that opens the rarely used filters ("Bộ lọc" on
 * a phone). Every toggle only edits `filters`, so the URL stays the one source of truth. On a phone the row scrolls
 * sideways.
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
const emit = defineEmits<{
  update: [patch: Partial<SubmissionFilters>];
  toggleAdvanced: [];
}>();
const locale = useLocaleStore();
/** Below sm the language box lives in the panel too, so the button counts it there. */
const phoneCount = computed(() => props.advancedCount + (props.filters.languageIds.length ? 1 : 0));

const chips = computed(() =>
  (
    ['all', 'mine', 'accepted', 'errors', 'grading'] as const satisfies readonly QuickFilter[]
  ).filter((chip) => chip !== 'mine' || props.username !== null),
);
/** The lamp of a result toggle: the same mark as the rows it keeps. */
const LAMPS: Partial<Record<QuickFilter, VerdictTone>> = {
  accepted: 'ac',
  errors: 'wa',
  grading: 'pending',
};
const isOn = (chip: QuickFilter) => isQuickFilterOn(props.filters, chip, props.username);
const toggle = (chip: QuickFilter) =>
  emit('update', quickFilterPatch(props.filters, chip, props.username));
</script>

<template>
  <div
    role="search"
    :aria-label="$t('submissions.rail.title')"
    class="flex items-center gap-2 max-sm:-mx-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-1 sm:flex-wrap"
  >
    <AppButton
      v-for="chip in chips"
      :key="chip"
      size="sm"
      class="shrink-0 whitespace-nowrap"
      :data-quick-filter="chip"
      :pressed="isOn(chip)"
      @click="toggle(chip)"
    >
      <template v-if="LAMPS[chip]" #icon><Lamp :tone="LAMPS[chip]!" still /></template>
      {{ $t(`submissions.quick.${chip}`) }}
      <span v-if="chip === 'grading' && gradingCount" class="font-mono text-small tabular-nums">{{
        formatNumber(gradingCount, locale.locale)
      }}</span>
    </AppButton>
    <LanguageFilterSelect
      class="max-sm:hidden"
      :filters="filters"
      :languages="languages"
      @update="emit('update', $event)"
    />
    <AdvancedFiltersButton
      :open="advancedOpen"
      :count="advancedCount"
      :phone-count="phoneCount"
      :panel-id="panelId"
      @toggle="emit('toggleAdvanced')"
    />
    <!-- A phone has one row: the list's tools end it and scroll with the toggles. -->
    <slot name="tools" />
  </div>
</template>
