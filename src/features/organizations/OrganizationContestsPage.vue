<script setup lang="ts">
import { computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ContestGroup from '@/features/contests/ContestGroup.vue';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { PHASE_ORDER, useContestListFilters } from '@/features/contests/use-contest-list-filters';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useOrganization } from './use-organization';

/**
 * The organization's contests: the /contests groups, narrowed by the API to this organization. Whoever may create contests
 * for it gets "Tạo kỳ thi", also in the empty state; the rows carry a pencil on the contests the viewer edits.
 */
const { slug, query: organizationQuery } = useOrganization();
const organizationId = computed(() => organizationQuery.data.value?.id);
const canCreate = computed(() => organizationQuery.data.value?.viewer?.canCreateContest === true);
const createTarget = computed(() => ({
  name: 'admin-contestNew',
  query: { organization: slug.value },
}));
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
  <GlassCard v-if="hasNone" as="div" data-testid="org-contests-empty">
    <EmptyState>{{ $t(canCreate ? 'orgs.noContestsCreator' : 'orgs.noContests') }}</EmptyState>
    <div v-if="canCreate" class="flex justify-center pb-6">
      <AppButton tone="primary" data-testid="org-tab-create-contest" :to="createTarget">
        <template #icon><Plus class="size-4" aria-hidden="true" /></template>
        {{ $t('create.contest') }}
      </AppButton>
    </div>
  </GlassCard>
  <div v-else-if="organizationId" class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <ToolbarSearch
        v-model="search"
        :label="$t('contests.list.search')"
        :placeholder="$t('contests.list.searchPlaceholder')"
        :maxlength="100"
        class="w-full sm:w-64"
      />
      <AppButton v-if="canCreate" data-testid="org-tab-create-contest" :to="createTarget">
        <template #icon><Plus class="size-4" aria-hidden="true" /></template>
        {{ $t('create.contest') }}
      </AppButton>
    </div>
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
