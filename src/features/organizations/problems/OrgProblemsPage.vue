<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { useFocusFallback } from '@/lib/use-focus-fallback';
import { ORG_BITS } from '../org-bits';
import { useOrganization } from '../use-organization';
import { orgFailureText } from './org-problem-errors';
import { filtersFromQuery, listStateOf, routeQueryOf, withFilter } from './org-problem-filters';
import type { OrgProblemFilters } from './org-problems.queries';
import { useOrgProblemsQuery, useProblemTagsQuery } from './org-problems.queries';
import OrgProblemFiltersBar from './OrgProblemFilters.vue';
import OrgProblemTable from './OrgProblemTable.vue';
import OrgProblemTableSkeleton from './OrgProblemTableSkeleton.vue';
import OrgProblemTagsDialog from './OrgProblemTagsDialog.vue';
import InlineBit from '@/components/InlineBit.vue';
import OrgBulkBar from './OrgBulkBar.vue';
import OrgBulkResult from './OrgBulkResult.vue';
import OrgBulkTagDialog from './OrgBulkTagDialog.vue';
import OrgTagCatalogue from './OrgTagCatalogue.vue';
import { useOrgProblemActions } from './use-org-problem-actions';
import { useOrgBulk } from './use-org-bulk';
import type { BulkCommand } from './use-org-bulk';

const route = useRoute();
const router = useRouter();
const { slug, query: organizationQuery } = useOrganization();
const organization = computed(() => organizationQuery.data.value);
const canRead = computed(() =>
  Boolean(organization.value?.viewer?.isMember || organization.value?.viewer?.canAdminister),
);
const isAdmin = computed(() => organization.value?.viewer?.canAdminister === true);
const filters = computed(() => filtersFromQuery(route.query));
const problems = useOrgProblemsQuery(slug, filters, canRead);
const tags = useProblemTagsQuery(slug, canRead);
const tagList = computed(() => tags.data.value?.items ?? []);
const listState = computed(() => listStateOf(problems.data.value?.meta.total, filters.value));
const filteredTagName = computed(
  () =>
    tagList.value.find((tag) => tag.slug === filters.value.tag)?.name ?? filters.value.tag ?? '',
);
/** Codes the admin ticked on the current page (Task 8's bulk bar acts on them). */
const selected = ref<string[]>([]);
const actions = useOrgProblemActions(slug);
const bulk = useOrgBulk(slug, selected);
/** A selection belongs to the page and organization it was ticked on: neither a pager link nor a move to another organization keeps it. */
watch([slug, filters], () => (selected.value = []));
const listCard = ref<{ $el: HTMLElement } | null>(null);
const listElement = () => listCard.value?.$el;
useFocusFallback(() => selected.value.length, listElement);
useFocusFallback(() => problems.data.value?.items.length, listElement);
const isBulkTagOpen = ref(false);
function runTagBulk(command: BulkCommand) {
  isBulkTagOpen.value = false;
  bulk.run(command);
}
const editing = ref<OrganizationProblem | null>(null);
const isTagsOpen = computed({
  get: () => editing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editing.value = null;
  },
});
const tagsFailure = computed(() =>
  actions.tagsMutation.error.value ? orgFailureText(actions.tagsMutation.error.value) : '',
);

function applyFilters(change: Partial<Omit<OrgProblemFilters, 'page'>>) {
  void router.replace({ query: routeQueryOf(withFilter(filters.value, change)) });
}
function openTags(row: OrganizationProblem) {
  actions.tagsMutation.reset();
  editing.value = row;
}
function saveTags(tagIds: string[]) {
  if (!editing.value) return;
  actions.tagsMutation.mutate(
    { code: editing.value.code, tagIds },
    { onSuccess: () => void (editing.value = null) },
  );
}
</script>

<template>
  <StatePanel
    v-if="organization && !canRead"
    :kind="ORG_BITS.forbidden"
    :title="$t('orgProblems.forbiddenTitle')"
    :body="$t('orgProblems.forbiddenBody')"
  />
  <section v-else-if="organization" data-testid="org-problems-tab" class="flex flex-col gap-5">
    <SettingsNotice v-if="!isAdmin" tone="info" :bit="ORG_BITS.memberReadOnly">
      <span
        class="mr-2 rounded-pill bg-accent-soft px-2 py-0.5 text-sm font-semibold"
        data-testid="read-only-badge"
        >{{ $t('orgProblems.readOnlyBadge') }}</span
      >
      {{ $t('orgProblems.memberReadOnly') }}
    </SettingsNotice>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)] lg:items-start">
      <GlassCard
        ref="listCard"
        as="div"
        tabindex="-1"
        data-testid="org-problem-list"
        class="flex min-w-0 flex-col gap-4 rounded-panel p-5"
      >
        <OrgProblemFiltersBar
          :filters="filters"
          :tags="tagList"
          :total="problems.data.value?.meta.total ?? null"
          :is-loading="problems.isLoading.value"
          @change="applyFilters"
        />
        <QueryState
          :loading="problems.isLoading.value"
          :error="problems.error.value"
          @retry="problems.refetch()"
        >
          <template #skeleton><OrgProblemTableSkeleton :is-admin="isAdmin" /></template>
          <StatePanel
            v-if="listState === 'empty'"
            :kind="ORG_BITS.listEmpty"
            :title="$t('orgProblems.emptyTitle')"
            :body="$t('orgProblems.emptyBody')"
          >
            <AppButton
              v-if="filters.archived === 'false'"
              @click="applyFilters({ archived: 'true' })"
            >
              {{ $t('orgProblems.showArchived') }}
            </AppButton>
          </StatePanel>
          <EmptyState
            v-else-if="listState === 'filteredEmpty'"
            compact
            :kind="ORG_BITS.filteredEmpty"
          >
            {{
              filters.tag
                ? $t('orgProblems.filteredEmptyTag', { tag: filteredTagName })
                : $t('orgProblems.filteredEmpty')
            }}
            <button
              v-if="filters.archived === 'false'"
              type="button"
              class="ml-1 inline-flex min-h-11 items-center font-semibold text-accent-text underline"
              @click="applyFilters({ archived: 'true' })"
            >
              {{ $t('orgProblems.showArchived') }}
            </button>
          </EmptyState>
          <template v-else-if="problems.data.value">
            <OrgProblemTable
              v-model:selected="selected"
              :rows="problems.data.value.items"
              :is-admin="isAdmin"
              :busy-code="actions.busyCode.value"
              @edit-tags="openTags"
              @toggle-archive="actions.toggleArchive"
            />
            <NumberedPager :meta="problems.data.value.meta" :label="$t('orgProblems.pager')" />
          </template>
        </QueryState>
        <p v-if="actions.failureText.value" role="alert" class="text-sm text-negative">
          {{ actions.failureText.value }}
        </p>
      </GlassCard>
      <OrgTagCatalogue
        v-if="isAdmin"
        :slug="slug"
        :tags="tagList"
        :is-loading="tags.isLoading.value"
        :error="tags.error.value"
        @retry="tags.refetch()"
      />
    </div>
    <OrgBulkResult
      v-if="bulk.result.value && bulk.action.value"
      :result="bulk.result.value"
      :action="bulk.action.value"
    />
    <p
      v-if="bulk.failureText.value"
      role="alert"
      data-testid="org-bulk-failure"
      class="flex items-center gap-2 text-sm text-negative"
    >
      <InlineBit :kind="ORG_BITS.bulkRefused" />{{ bulk.failureText.value }}
    </p>
    <OrgBulkBar
      v-if="isAdmin && selected.length > 0"
      :count="selected.length"
      :is-pending="bulk.isPending.value"
      @archive="bulk.run({ action: 'archive' })"
      @unarchive="bulk.run({ action: 'unarchive' })"
      @tag="isBulkTagOpen = true"
      @clear="selected = []"
    />
    <OrgBulkTagDialog
      v-model:visible="isBulkTagOpen"
      :tags="tagList"
      :busy="bulk.isPending.value"
      :count="selected.length"
      @confirm="runTagBulk"
    />
    <OrgProblemTagsDialog
      v-model:visible="isTagsOpen"
      :problem="editing"
      :tags="tagList"
      :busy="actions.tagsMutation.isPending.value"
      :failure-text="tagsFailure"
      @save="saveTags"
    />
  </section>
</template>
