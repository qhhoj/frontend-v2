<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import Toolbar from '@/components/ui/Toolbar.vue';
import SelectField from '@/components/ui/SelectField.vue';
import CreateShortcut from '@/features/admin/creation/CreateShortcut.vue';
import { computed, reactive } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useContestTagsQuery } from './contest-extras.queries';
import ContestGroup from './ContestGroup.vue';
import ContestTagFilter from './ContestTagFilter.vue';
import { catalogueBySlug, tagFilterState } from './tag-chips';
import { PHASE_ORDER, useContestListFilters } from './use-contest-list-filters';

const { filters, update } = useContestListFilters();
const search = useDebouncedText(
  () => filters.value.search,
  (text) => update({ search: text }),
);
const shownPhases = computed(() => (filters.value.phase ? [filters.value.phase] : PHASE_ORDER));
const locale = useLocaleStore();
/** Each group reports its total; the toolbar's count is their sum, shown once every shown group has answered. */
const groupTotals = reactive<Partial<Record<ContestPhase, number | null>>>({});
const countText = computed(() => {
  const totals = shownPhases.value.map((phase) => groupTotals[phase]);
  if (totals.some((total) => total === undefined || total === null)) return '';
  const sum = totals.reduce<number>((acc, total) => acc + (total ?? 0), 0);
  return translate('contests.list.count', { n: formatNumber(sum, locale.locale) }, sum);
});
/** The select's values are the URL's: `rated=1` for the rated-only choice, none for both. */
const ratedOptions = computed(() => [
  { value: 'any', label: translate('contests.list.ratedAny') },
  { value: 'rated', label: translate('contests.list.ratedOnly') },
]);
const ratedChoice = computed({
  get: () => (filters.value.isRatedOnly ? 'rated' : 'any'),
  set: (choice: string) => update({ isRatedOnly: choice === 'rated' }),
});
const { data: tags, isPending: isTagsPending, isError: hasTagsFailed } = useContestTagsQuery();
const catalogue = computed(() => (tags.value ? catalogueBySlug(tags.value) : undefined));
const tagState = computed(() => tagFilterState(filters.value.tag, catalogue.value));
/** An unknown tag is not sent: the groups list every contest and the row says why. */
const listFilters = computed(() =>
  tagState.value === 'unknown' ? { ...filters.value, tag: null } : filters.value,
);
const tagName = computed(() => {
  const slug = listFilters.value.tag;
  return slug === null ? null : (catalogue.value?.get(slug)?.name ?? slug);
});
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader :title="$t('contests.title')">
        <template #actions><CreateShortcut kind="contest" /></template>
      </PageHeader>
    </template>
    <template #toolbar>
      <Toolbar>
        <template #left>
          <SearchInput
            v-model="search"
            :label="$t('contests.list.search')"
            :placeholder="$t('contests.list.searchPlaceholder')"
            :maxlength="100"
            class="w-full sm:w-64"
          />
          <SelectField
            v-model="ratedChoice"
            :prefix="$t('contests.list.ratedLabel')"
            :options="ratedOptions"
            :active="ratedChoice !== 'any'"
            class="w-full sm:w-auto"
          />
        </template>
        <template #right>
          <p
            data-testid="contests-count"
            aria-live="polite"
            class="font-mono text-meta tabular-nums"
          >
            {{ countText }}
          </p>
        </template>
        <template #chips>
          <ContestTagFilter
            :tags="tags ?? []"
            :selected="filters.tag"
            :state="tagState"
            :is-loading="isTagsPending"
            :has-failed="hasTagsFailed"
            @select="(tag) => update({ tag })"
          />
        </template>
      </Toolbar>
    </template>
    <ContestGroup
      v-for="phase in shownPhases"
      :key="phase"
      :phase="phase"
      :filters="listFilters"
      :tag-name="tagName"
      @page="(page) => update({ page })"
      @count="(total) => (groupTotals[phase] = total)"
    />
  </PageLayout>
</template>
