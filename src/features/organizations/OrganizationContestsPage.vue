<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import ContestGroup from '@/features/contests/ContestGroup.vue';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { PHASE_ORDER, useContestListFilters } from '@/features/contests/use-contest-list-filters';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useOrganization } from './use-organization';

/** The organization's contests: the /contests groups, narrowed by the API to this organization. */
const { slug, query: organizationQuery } = useOrganization();
const organizationId = computed(() => organizationQuery.data.value?.id);
const listRoute = computed(() => ({ name: 'organization-contests', params: { slug: slug.value } }));
const { filters, update } = useContestListFilters();
const search = useDebouncedText(
  () => filters.value.search,
  (text) => update({ search: text }),
);
const shownPhases = computed(() => (filters.value.phase ? [filters.value.phase] : PHASE_ORDER));
/** One row asks whether the organization has any contest at all, whatever the phase or search. */
const anyQuery = computed(() => ({ organization: organizationId.value, page: 1, pageSize: 1 }));
const anyContest = useContestListQuery(anyQuery);
const hasNone = computed(() => anyContest.data.value?.meta.total === 0);
</script>

<template>
  <GlassCard v-if="hasNone" as="div">
    <EmptyState>{{ $t('orgs.noContests') }}</EmptyState>
  </GlassCard>
  <div v-else-if="organizationId" class="flex flex-col gap-6">
    <ToolbarSearch
      v-model="search"
      :label="$t('contests.list.search')"
      :placeholder="$t('contests.list.searchPlaceholder')"
      :maxlength="100"
      class="w-full sm:w-64"
    />
    <ContestGroup
      v-for="phase in shownPhases"
      :key="phase"
      :phase="phase"
      :filters="filters"
      :organization-id="organizationId"
      :list-route="listRoute"
      @page="(page) => update({ page })"
    />
  </div>
</template>
