<script setup lang="ts">
import { GitCompareArrows } from 'lucide-vue-next';
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import FilterToggle from '@/features/problems/FilterToggle.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdvancedFiltersButton from './AdvancedFiltersButton.vue';
import LanguageFilterSelect from './LanguageFilterSelect.vue';
import { isQuickFilterOn, quickFilterPatch } from './quick-filters';
import type { QuickFilter } from './quick-filters';
import type { SubmissionFilters } from './use-submission-filters';

/**
 * The chips above the list: Của tôi (signed-in viewers), AC, Lỗi, Đang chấm, the language (in the panel on a phone), the
 * button that opens the filters ("Bộ lọc" on a phone), and "So sánh", which shows the rows' pick boxes. Every chip but
 * "So sánh" only edits `filters`, so the URL stays the one source of truth. On a phone the row scrolls sideways.
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
  /** Whether rows show their compare boxes; null hides "So sánh" (a viewer who cannot compare). */
  comparing: boolean | null;
}>();
const emit = defineEmits<{
  update: [patch: Partial<SubmissionFilters>];
  toggleAdvanced: [];
  toggleCompare: [];
}>();
const locale = useLocaleStore();
/** Below sm the language box lives in the panel too, so the button counts it there. */
const phoneCount = computed(() => props.advancedCount + (props.filters.languageIds.length ? 1 : 0));

const chips = computed(() =>
  (['mine', 'accepted', 'errors', 'grading'] as const satisfies readonly QuickFilter[]).filter(
    (chip) => chip !== 'mine' || props.username !== null,
  ),
);
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
    <FilterToggle
      v-for="chip in chips"
      :key="chip"
      class="shrink-0 whitespace-nowrap"
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
    <FilterToggle
      v-if="comparing !== null"
      data-testid="compare-mode"
      class="shrink-0 whitespace-nowrap"
      :pressed="comparing"
      @toggle="emit('toggleCompare')"
    >
      <GitCompareArrows class="size-4" aria-hidden="true" />
      {{ $t('submissions.quick.compare') }}
    </FilterToggle>
  </div>
</template>
