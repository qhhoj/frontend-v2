<script setup lang="ts">
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { computed } from 'vue';
import { translate } from '@/i18n';
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
/** An unknown tag is not sent: the groups list every contest and the row says why (M4A). */
const listFilters = computed(() =>
  tagState.value === 'unknown' ? { ...filters.value, tag: null } : filters.value,
);
const tagName = computed(() => {
  const slug = listFilters.value.tag;
  return slug === null ? null : (catalogue.value?.get(slug)?.name ?? slug);
});
</script>

<template>
  <div class="page-column">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">
          {{ $t('contests.title') }}
        </h1>
        <p class="mt-1 text-muted">{{ $t('contests.list.lead') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <ToolbarSearch
          v-model="search"
          :label="$t('contests.list.search')"
          :placeholder="$t('contests.list.searchPlaceholder')"
          :maxlength="100"
          class="w-64"
        />
        <ToolbarSelect
          v-model="ratedChoice"
          :label="$t('contests.list.ratedLabel')"
          :options="ratedOptions"
          :active="ratedChoice !== 'any'"
        />
      </div>
    </header>
    <ContestTagFilter
      :tags="tags ?? []"
      :selected="filters.tag"
      :state="tagState"
      :is-loading="isTagsPending"
      :has-failed="hasTagsFailed"
      @select="(tag) => update({ tag })"
    />
    <ContestGroup
      v-for="phase in shownPhases"
      :key="phase"
      :phase="phase"
      :filters="listFilters"
      :tag-name="tagName"
      @page="(page) => update({ page })"
    />
  </div>
</template>
